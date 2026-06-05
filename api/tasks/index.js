const {
  TASKS_TABLE,
  sendError,
  airtableFetch,
  listAll,
  toMcpShape,
  isOpenTask,
  fieldsByName,
} = require('../_airtable');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const includeClosed = req.query?.includeClosed === '1' || req.query?.includeClosed === 'true';
      const records = includeClosed ? await listAll(TASKS_TABLE) : (await listAll(TASKS_TABLE)).filter(isOpenTask);
      return res.status(200).json({ records });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const fields = fieldsByName(body.fields || {});
      const data = await airtableFetch(`${TASKS_TABLE}?returnFieldsByFieldId=true`, {
        method: 'POST',
        body: JSON.stringify({
          records: [{ fields }],
          typecast: true,
        }),
      });
      return res.status(201).json({ records: (data.records || []).map(toMcpShape) });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
};
