import {describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {addDays,allocate,dayKey,initial,learn,review,spell,spellingCorrect,parseBackup,dueWords,streak,validateWords,type Word} from '../src/core';
import {saveState,loadState} from '../src/storage';
import demo from '../src/words.json';
const words=demo as Word[];const day='2026-10-13';
describe('词库和每日计划',()=>{
 it('100 个独立词条字段完整，没有重复词',()=>{expect(validateWords(words)).toHaveLength(100)});
 it('每日分配30词，同日重开保持计划且不会重学',()=>{let s=allocate(initial(words),day);const plan=s.plans[day];expect(plan).toHaveLength(30);s=learn(s,plan[0],true,day);expect(allocate(s,day).plans[day]).toEqual(plan);expect(learn(s,plan[0],false,day).events).toHaveLength(1)});
 it('次日优先未学词，耗尽词库不伪造新词',()=>{let s=allocate(initial(words),day);for(const id of s.plans[day])s=learn(s,id,true,day);s=allocate(s,addDays(day,1));expect(s.plans[addDays(day,1)]).toHaveLength(30);expect(s.plans[addDays(day,1)].every(id=>!s.progress[id])).toBe(true);for(const w of words)s=learn(s,w.id,true,day);expect(allocate(s,addDays(day,2)).plans[addDays(day,2)]).toHaveLength(0)});
 it('目标改变保留已分配词',()=>{let s=allocate(initial(words),day);s.settings.goal=10;expect(allocate(s,day).plans[day]).toHaveLength(30);s.settings.goal=40;expect(allocate(s,day).plans[day]).toHaveLength(40)});
});
describe('日历和间隔重复',()=>{
 it('使用本地日期，跨月、闰年、跨年正确',()=>{expect(dayKey(new Date(2026,9,13,23,59))).toBe(day);expect(addDays('2024-02-28',1)).toBe('2024-02-29');expect(addDays('2026-12-31',1)).toBe('2027-01-01')});
 it('首次1天，记得逐步推进至30天并掌握',()=>{let s=learn(initial(words),words[0].id,true,day);expect(s.progress[words[0].id].interval).toBe(1);for(const n of [3,7,14,30]){const due=s.progress[words[0].id].due;s=review(s,words[0].id,2,due);expect(s.progress[words[0].id].interval).toBe(n)}expect(s.progress[words[0].id].mastered).toBe(true)});
 it('忘记重置1天，模糊缩短；重复点击不多计',()=>{let s=learn(initial(words),words[0].id,true,day);s=review(s,words[0].id,3,addDays(day,1));expect(s.progress[words[0].id].interval).toBe(7);const due=s.progress[words[0].id].due;s=review(s,words[0].id,1,due);expect(s.progress[words[0].id].interval).toBe(1);expect(review(s,words[0].id,3,due)).toBe(s);s=review(s,words[0].id,0,addDays(due,1));expect(s.progress[words[0].id].stage).toBe(0)});
 it('未来到期不允许提前复习，错词除外，日期倒退不重复计数',()=>{let s=learn(initial(words),words[0].id,true,day);expect(review(s,words[0].id,2,day)).toBe(s);expect(dueWords(s,day)).toHaveLength(0);s=review(s,words[0].id,2,addDays(day,1));expect(dueWords(s,day)).toHaveLength(0)});
 it('连续学习允许今天尚未开始',()=>{const s=learn(initial(words),words[0].id,true,day);expect(streak(s.events,addDays(day,1))).toBe(1);expect(streak(s.events,addDays(day,2))).toBe(0)});
});
describe('拼写和备份',()=>{
 it('忽略大小写首尾空格，内部错误仍判错',()=>{expect(spellingCorrect('  AcQuIrE ','acquire')).toBe(true);expect(spellingCorrect('ac quire','acquire')).toBe(false)});
 it('错误加入错词复习，同一提交幂等',()=>{let s=learn(initial(words),words[0].id,true,day);s=spell(s,words[0].id,false,day,'one');expect(dueWords(s,day)).toHaveLength(1);expect(spell(s,words[0].id,false,day,'one')).toBe(s)});
 it('JSON备份完整往返，拒绝无效字段和引用',()=>{const s=allocate(learn(initial(words),words[0].id,true,day),day);expect(parseBackup(JSON.stringify(s))).toEqual(s);expect(()=>parseBackup('{"version":2}')).toThrow();const bad=structuredClone(s);bad.settings.goal=-1;expect(()=>parseBackup(JSON.stringify(bad))).toThrow();const bad2=structuredClone(s);bad2.progress[words[0].id].due='2026-02-30';expect(()=>parseBackup(JSON.stringify(bad2))).toThrow();expect(()=>validateWords([words[0],words[0]])).toThrow()});
 it('IndexedDB跨连接持久化，保存完成后恢复学习记录',async()=>{let s=allocate(initial(words),day);s=learn(s,s.plans[day][0],true,day);await saveState(s);expect(await loadState()).toEqual(s);s=review(s,words[0].id,2,addDays(day,1));await saveState(s);expect((await loadState())?.progress[words[0].id].reviews).toBe(1)});
});

describe('持久化冲突与时区回跳保护',()=>{
 it('旧标签页不能覆盖新进度',async()=>{const original=initial(words);await saveState(original);const newer=learn(original,words[0].id,true,day);await saveState(newer,original);await expect(saveState(original,original)).rejects.toThrow('其他页面');expect(await loadState()).toEqual(newer)});
 it('日期向前后又回到曾复习日期，仍不重复计数',()=>{const id=words[0].id;let s=learn(initial(words),id,true,day);const first=addDays(day,1);s=review(s,id,0,first);s=review(s,id,0,addDays(first,1));expect(review(s,id,2,first)).toBe(s);expect(dueWords(s,first)).toHaveLength(0)});
});
