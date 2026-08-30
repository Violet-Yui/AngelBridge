insert into demo_scenario_catalog (
  scenario_id,
  title,
  summary,
  dataset_version,
  is_synthetic
) values
  (
    'studio-photography',
    '周末工作室 × 品牌摄影',
    '用周末工作室使用权置换一组品牌照片。',
    'demo-2026-08-v1',
    true
  ),
  (
    'rural-content',
    '田园空间 × 内容共创',
    '用田园空间体验与拍摄条件置换内容策划和传播。',
    'demo-2026-08-v1',
    true
  ),
  (
    'product-web',
    '产品策划 × 网站开发',
    '用产品策划与用户研究能力置换可演示的网站开发。',
    'demo-2026-08-v1',
    true
  )
on conflict (scenario_id) do update set
  title = excluded.title,
  summary = excluded.summary,
  dataset_version = excluded.dataset_version,
  is_synthetic = excluded.is_synthetic;
