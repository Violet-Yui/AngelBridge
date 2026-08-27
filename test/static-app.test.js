import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('document exposes a mobile app mount and module entry', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="app"/);
  assert.match(html, /type="module" src="app\.js"/);
  assert.match(html, /viewport-fit=cover/);
});

test('all twelve zodiac svg assets are declared', async () => {
  const source = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
  for (const file of ['01-rat','02-ox','03-tiger','04-rabbit','05-dragon','06-snake','07-horse','08-goat','09-monkey','10-rooster','11-dog','12-pig']) {
    assert.match(source, new RegExp(`${file}\\.svg`));
  }
});

test('bottom navigation keeps five labeled destinations', async () => {
  const source = await readFile(new URL('../src/views.js', import.meta.url), 'utf8');
  for (const label of ['天使桥', '消息', '创建', '灵宠', '我']) assert.match(source, new RegExp(label));
});

test('primary screens follow the eight Ardot frames without an invented home hero', async () => {
  const source = `${await readFile(new URL('../src/views.js', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/data.js', import.meta.url), 'utf8')}`;
  for (const screen of ['热门', '视频', '经验', '闲置', '找工作', '找物', '人生树', '找人']) {
    assert.match(source, new RegExp(screen));
  }
  assert.doesNotMatch(source, /home-intro/);
});
