import {test,expect} from '@playwright/test';
test('手机学习、持久化、拼写、备份恢复和真实统计',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/让每个单词/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'开始学习'}).click();await expect(page.getByRole('heading',{name:'acquire',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'☆ 收藏'}).click();await expect(page.getByRole('button',{name:'★ 已收藏'})).toBeVisible();
 await page.getByRole('button',{name:'认识，记住了'}).click();await expect(page.getByRole('heading',{name:'adapt',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('累计学习', {exact:true})).toBeVisible();await expect(page.locator('.metrics article').nth(2).locator('b')).toHaveText('1');
 await page.getByRole('button',{name:'开始学习'}).click();await expect(page.getByRole('heading',{name:'adapt',exact:true})).toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'首页'}).click();await page.getByRole('button',{name:'拼写测试'}).click();
 await page.getByLabel('请输入英文单词').fill(' ACQUIRE ');await page.getByRole('button',{name:'提交答案'}).click();await expect(page.getByText('回答正确 · acquire')).toBeVisible();await page.getByRole('button',{name:'下一词'}).click();await expect(page.getByText('答对 1 词 · 正确率 100%')).toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'设置'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出 JSON 备份'}).click();const file=await download;const backupPath=await file.path();expect(backupPath).toBeTruthy();
 page.once('dialog',d=>d.accept());await page.locator('input[type=file]').first().setInputFiles(backupPath!);await expect(page.getByText('备份已恢复。')).toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'统计'}).click();await expect(page.locator('.metrics article').first().locator('b')).toHaveText('1');await expect(page.locator('.metrics article').nth(2).locator('b')).toHaveText('100%');
 await page.screenshot({path:`test-results/${test.info().project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('错词及时进入复习，格式错误备份不覆盖数据',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'开始学习'}).click();await page.getByRole('button',{name:'认识，记住了'}).click();await page.getByRole('navigation').getByRole('button',{name:'首页'}).click();await page.getByRole('button',{name:'拼写测试'}).click();await page.getByLabel('请输入英文单词').fill('wrong');await page.getByRole('button',{name:'提交答案'}).click();await expect(page.getByText('已加入错词复习。')).toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'复习'}).click();await page.getByRole('button',{name:'开始本次练习'}).click();await expect(page.getByRole('heading',{name:'acquire',exact:true})).toBeVisible();await page.getByRole('button',{name:'记得',exact:true}).click();await expect(page.getByText('已及时保存 1 条练习记录。')).toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'设置'}).click();await page.locator('input[type=file]').first().setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":2}')});await expect(page.getByRole('alert')).toContainText('不支持的备份版本');
});
