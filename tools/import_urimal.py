#!/usr/bin/env python3
"""Build the Korean noun word-chain dictionary from official NIKL exports.

Reads Korean government archive downloads. Only stores lexical headwords;
excludes definitions, examples, metadata. Keeps existing standard dictionary
words and augments with the Urimalsaem noun headwords (including regional and
North Korean vocabulary tagged 명사). The JSON source files use word_unit=어휘.
Requires: Python with orjson for speed; falls back to Python json.
"""
from pathlib import Path
from zipfile import ZipFile
import json, re, sys, unicodedata
try:
 import orjson
 loads=orjson.loads
except ImportError:
 loads=json.loads
ROOT=Path(__file__).resolve().parents[1]
HANGUL=re.compile(r'^[가-힣]{2,24}$')
TAIL=re.compile(r'[\u00b9\u00b2\u00b3\u2070-\u2079\u2460-\u2473]+$')

def norm(raw):
 if not isinstance(raw,str): return None
 s=unicodedata.normalize('NFC',raw.strip()).replace('^','').replace('-','')
 s=TAIL.sub('',s)
 return s if HANGUL.fullmatch(s) else None

def extract(archive,existing):
 counts={'items':0,'nouns':0,'new':0,'skipped_unit':0}
 with ZipFile(archive) as z:
  members=sorted((x for x in z.infolist() if x.filename.lower().endswith('.json')),key=lambda x:x.filename)
  if not members:raise ValueError('No JSON files in archive')
  for i,item in enumerate(members,1):
   raw=loads(z.read(item))
   records=raw.get('channel',{}).get('item',[])
   if isinstance(records,dict):records=[records]
   for record in records:
    counts['items']+=1
    info=record.get('wordinfo',{})
    if info.get('word_unit') not in ('어휘','단어',None):
     counts['skipped_unit']+=1;continue
    sense=record.get('senseinfo',{})
    if isinstance(sense,list):parts=[x.get('pos') for x in sense if isinstance(x,dict)]
    elif isinstance(sense,dict):parts=[sense.get('pos')]
    else:parts=[]
    if '명사' not in parts:continue
    counts['nouns']+=1
    w=norm(info.get('word'))
    if w and w not in existing:existing.add(w);counts['new']+=1
   del raw,records
   if i%5==0 or i==len(members): print(f'Processed {i}/{len(members)} files; {counts}',flush=True)
 return counts

def main():
 if len(sys.argv)<2:raise SystemExit('Usage: python tools/import_urimal.py /path/to/urimal.zip')
 existing_path=ROOT/'data/dictionary.json'
 existing=set(json.loads(existing_path.read_text(encoding='utf-8'))) if existing_path.exists() else set()
 standard_count=len(existing)
 counts=extract(Path(sys.argv[1]),existing)
 words=sorted(existing)
 for name in ('data/dictionary.json','public/words.json'):
  target=ROOT/name
  target.write_text(json.dumps(words,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 metadata={'source':['국립국어원 표준국어대사전 JSON 2026-11-06','국립국어원 우리말샘 JSON 2026-11-04'],'standard_words_before_merge':standard_count,'unique_combined_words':len(words),'urimal_import_stats':counts,'part_of_speech':'명사','filter':'한글 완성형 2~24글자, 어휘 항목, 중복 제외','license':'자료 이용 시 국립국어원 제공조건 확인'}
 (ROOT/'data/dictionary-stats.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(metadata,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
