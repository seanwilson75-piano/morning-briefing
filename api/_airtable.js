const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN;
const TASKS_TABLE = process.env.AIRTABLE_TASKS_TABLE_ID || 'tbls1wuZfWWH4YTP7';
const PROJECTS_TABLE = process.env.AIRTABLE_PROJECTS_TABLE_ID || 'tblzuolKVWrYyn9Ac';

const TASK_FIELDS = {
  fldUUx7BkHssWLeRG: 'Task Name',
  fldzo5B8Bbx1urmAh: 'Project',
  fld795pg8s4qzOocM: 'Parent Task',
  fld8J3AcGKm7JJSi9: 'Task Type',
  fldkVAE63LFx9bRyN: 'Status',
  fldC3CwTUwODyql9Z: 'checked off',
  fld9H67ZAQ4Gja8s7: 'Due Date',
  fld9kkcuI7FZqdlt7: 'Notes',
  fld9pnEfHVKWJqyV5: 'Work Link',
  fldDjlKNG61br528g: 'Area',
  fldNofihfvu3lMlOS: 'Do Date',
  fld68Hn2GQgrwt4wP: 'This Week',
  fld7jjXzJiBjp9yuY: 'This Month',
  fldAiRTP9xjYDAif7: 'Next Week',
  fldAihjL7bCZGntEq: 'Next Month',
  fld5pVkMaThEoOrEL: 'Priority',
  fldLtGFrJhuc0v3a6: 'Next Action Detail',
  fldleHIFfzyU2mGRN: 'Related Links / Resources',
  fldw8NijkAhgbFNYx: 'Definition of Done',
  fldTVnsU3sxcT13vs: 'Waiting On',
  fldINfzpA9SM3CM6u: 'Briefing Include',
};

function requireConfig() {
  if (!BASE_ID || !TOKEN) {
    const missing = [!BASE_ID && 'AIRTABLE_BASE_ID', !TOKEN && 'AIRTABLE_API_KEY'].filter(Boolean).join(', ');
    const err = new Error(`Missing environment variable(s): ${missing}`);
    err.status = 500;
    throw err;
  }
}

function checkPassword(req) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return true;
  const provided = req.headers['x-dashboard-password'] || req.query?.password;
  return provided === expected;
}

function sendError(res, err) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || String(err) });
}

async function airtableFetch(path, options = {}) {
  requireConfig();
  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error?.message || data.error || `Airtable request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function listAll(tableId) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
    if (offset) params.set('offset', offset);
    const data = await airtableFetch(`${tableId}?${params.toString()}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records.map(toMcpShape);
}

function toMcpShape(record) {
  return {
    id: record.id,
    createdTime: record.createdTime,
    cellValuesByFieldId: record.fields || {},
  };
}

function selectName(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return String(value);
}

function isOpenTask(record) {
  const fields = record.cellValuesByFieldId || {};
  const status = selectName(fields.fldkVAE63LFx9bRyN);
  const checkedOff = fields.fldC3CwTUwODyql9Z === true;
  return !checkedOff && status !== 'Done' && status !== 'Canceled';
}

function fieldsByName(fields = {}) {
  const output = {};
  Object.entries(fields).forEach(([key, value]) => {
    const name = TASK_FIELDS[key] || key;
    output[name] = value;
  });
  return output;
}

module.exports = {
  TASKS_TABLE,
  PROJECTS_TABLE,
  TASK_FIELDS,
  checkPassword,
  sendError,
  airtableFetch,
  listAll,
  toMcpShape,
  isOpenTask,
  fieldsByName,
};
