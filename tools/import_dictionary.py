#!/usr/bin/env python3
"""Convert a Korean dictionary ZIP/XML/JSON/CSV/TXT into game word lists.

Standard library only. Intended for legally obtained NIKL dictionary exports.
No quotes, examples, definitions, audio, or media are copied.
"""
import argparse
import csv
import io
import itertools
import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HANGUL = re.compile(r'^[가-힣]{2,24}$')
HOMONYM = re.compile(r'[\u00b9\u00b2\u00b3\u2070-\u2079\u2460-\u2473\d]+$')
NOUNS = {'명사', 'noun', 'n', 'nn', 'nnc', 'nng', 'nnp'}
WORD_FIELDS = ('word', '표제어', '어휘', '낱말', 'headword', 'lemma')
POS_FIELDS = ('pos', '품사', 'part', 'partOfSpeech', 'part_of_speech')


def clean_word(raw):
    if not isinstance(raw, str):
        return ''
    raw = unicodedata.normalize('NFC', raw.strip())
    # Dictionary display notations for morpheme boundaries and homograph numbers.
    raw = HOMONYM.sub('', raw).replace('^', '').replace('-', '')
    return raw if HANGUL.fullmatch(raw) else ''


def noun_ok(pos, all_pos):
    if all_pos:
        return True
    if isinstance(pos, (list, tuple)):
        return any(noun_ok(p, all_pos) for p in pos)
    return str(pos or '').strip().lower() in NOUNS


def get_nested(d, *paths):
    for path in paths:
        cur = d
        for key in path:
            if not isinstance(cur, dict):
                cur = None
                break
            cur = cur.get(key)
        if cur is not None:
            return cur
    return None


def pick_field(obj, fields):
    if not isinstance(obj, dict):
        return None
    for k in fields:
        if k in obj:
            return obj[k]
    return None


def json_records(node, depth=0):
    if depth > 30:
        return
    if isinstance(node, dict):
        info = get_nested(node, ('wordInfo',), ('word_info',), ('wordInfo', 'word'), ('word_info', 'word'))
        if isinstance(info, dict):
            if info.get('word_unit',info.get('wordUnit','단어')) != '단어':
                return
            word = pick_field(info, WORD_FIELDS)
        elif isinstance(info, str):
            word = info
        else:
            word = pick_field(node, WORD_FIELDS)
        pos = pick_field(node, POS_FIELDS)
        if pos is None:
            sense = get_nested(node, ('senseInfo',), ('sense_info',), ('sense',))
            if isinstance(sense, dict):
                pos = pick_field(sense, POS_FIELDS)
            elif isinstance(sense, list):
                pos = [pick_field(s, POS_FIELDS) for s in sense]
        if pos is None and isinstance(info, dict):
            pos = pick_field(info, POS_FIELDS)
            if pos is None:
                pos_info = info.get('pos_info', info.get('posInfo', []))
                if isinstance(pos_info, list):
                    pos = [pick_field(p, POS_FIELDS) for p in pos_info]
                elif isinstance(pos_info, dict):
                    pos = pick_field(pos_info, POS_FIELDS)
        if isinstance(word, str) and pos is not None:
            yield word, pos
            return
        for val in node.values():
            if isinstance(val, (dict, list)):
                yield from json_records(val, depth+1)
    elif isinstance(node, list):
        for el in node:
            yield from json_records(el, depth+1)


def local(tag):
    return tag.rsplit('}', 1)[-1].lower()


def xml_child(parent, name):
    for c in parent:
        if local(c.tag) == name.lower():
            return c
    return None


def xml_value(parent, name):
    if parent is None:
        return None
    c = xml_child(parent, name)
    return ''.join(c.itertext()).strip() if c is not None else None


def parse_xml(buffer):
    for _, el in ET.iterparse(buffer, events=('end',)):
        if local(el.tag) != 'item':
            continue
        info = xml_child(el, 'wordInfo')
        if info is None:
            info = xml_child(el, 'word_info')
        unit = xml_value(info, 'word_unit') or xml_value(info, 'wordUnit')
        if unit and unit != '단어':
            el.clear()
            continue
        word = xml_value(info, 'word') or xml_value(el, 'word')
        senses = [c for c in el.iter() if local(c.tag) in ('senseinfo', 'sense_info', 'pos_info', 'posinfo')]
        parts = [xml_value(s, 'pos') for s in senses]
        if not any(parts):
            parts = [xml_value(el, 'pos') or xml_value(info, 'pos')]
        if word:
            yield word, parts
        el.clear()


def parse_csv(buffer):
    text = io.TextIOWrapper(buffer, encoding='utf-8-sig', errors='replace', newline='')
    try:
        sample = text.read(8192)
        text.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=',\t;')
        except csv.Error:
            dialect = csv.excel_tab if '\t' in sample else csv.excel
        reader = csv.reader(text, dialect)
        rows = iter(reader)
        headers = next(rows, [])
        lowered = [str(x).strip().lower() for x in headers]
        word_i = next((i for i,h in enumerate(lowered) if h in {x.lower() for x in WORD_FIELDS}), None)
        pos_i = next((i for i,h in enumerate(lowered) if h in {x.lower() for x in POS_FIELDS}), None)
        if word_i is None:
            # For headerless word,pos CSV files, process the first row too.
            word_i, pos_i = 0, 1 if len(headers)>1 else None
            rows = itertools.chain([headers], rows)
        for row in rows:
            if len(row)>word_i:
                yield row[word_i], row[pos_i] if pos_i is not None and len(row)>pos_i else None
    finally:
        text.detach()


def parse_txt(buffer):
    for raw in io.TextIOWrapper(buffer, encoding='utf-8-sig', errors='replace'):
        s=raw.strip()
        if not s or s.startswith('#'):
            continue
        if '\t' in s:
            parts=s.split('\t')
            yield parts[0],parts[1] if len(parts)>1 else None
        else:
            yield s, None


def input_files(path):
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as zf:
            for inf in zf.infolist():
                ext=Path(inf.filename).suffix.lower()
                if inf.is_dir() or ext not in ('.xml','.json','.csv','.tsv','.txt'):
                    continue
                if inf.file_size > 500_000_000:
                    raise ValueError(f'ZIP member too large: {inf.filename}')
                with zf.open(inf) as f:
                    yield inf.filename, ext, f
    elif path.is_file():
        with open(path, 'rb') as f:
            yield path.name, path.suffix.lower(), f
    elif path.is_dir():
        for f in sorted(path.rglob('*')):
            if f.suffix.lower() in ('.xml','.json','.csv','.tsv','.txt') and f.is_file():
                with open(f, 'rb') as stream:
                    yield f.name, f.suffix.lower(), stream


def read_records(ext, stream):
    if ext == '.xml':
        yield from parse_xml(stream)
    elif ext == '.json':
        yield from json_records(json.load(io.TextIOWrapper(stream,encoding='utf-8-sig')))
    elif ext in ('.csv','.tsv'):
        yield from parse_csv(stream)
    elif ext == '.txt':
        yield from parse_txt(stream)


def main():
    ap=argparse.ArgumentParser(description='사전 ZIP/XML/JSON/CSV/TXT를 끝말잇기 단어 목록으로 변환')
    ap.add_argument('source', type=Path,help='사전 파일이나 폴더')
    ap.add_argument('--all-pos',action='store_true',help='명사 외의 품사도 허용')
    ap.add_argument('--allow-untagged',action='store_true',help='품사가 없는 TXT/CSV 단어도 허용')
    ap.add_argument('--output',type=Path,help='단어 배열을 저장할 JSON 경로 (기본값: data/dictionary.json)')
    args=ap.parse_args()
    if not args.source.exists():
        ap.error(f'파일을 찾지 못했습니다: {args.source}')
    seen=set()
    files=0
    for filename, ext, buffer in input_files(args.source):
        files+=1
        n=0
        for raw,pos in read_records(ext,buffer):
            word=clean_word(raw)
            if word and ((pos is None and args.allow_untagged) or (pos is not None and noun_ok(pos,args.all_pos))):
                if word not in seen:
                    seen.add(word);n+=1
        print(f'{filename}: 추가 {n:,}개',file=sys.stderr)
    if not files:
        ap.error('지원되는 사전 파일이 없습니다. ZIP/XML/JSON/CSV/TXT를 사용하세요.')
    if not seen:
        ap.error('인식한 단어가 없습니다. 사전의 내부 구조나 품사 필드를 확인해야 합니다. TXT/단어만 있는 CSV는 --allow-untagged를 사용하세요.')
    words=sorted(seen)
    output=args.output or ROOT/'data'/'dictionary.json'
    output.parent.mkdir(parents=True,exist_ok=True)
    (ROOT/'public').mkdir(parents=True,exist_ok=True)
    for dest in (output, ROOT/'public'/'words.json'):
        dest.write_text(json.dumps(words,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'완료: {len(words):,}개 단어. 서버: {output} / 혼자 연습: public/words.json')
    print('명령 실행 후 npm start로 서버를 다시 시작하세요.')


if __name__=='__main__':
    main()
