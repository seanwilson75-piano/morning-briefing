const {
  TASKS_TABLE,
  sendError,
  airtableFetch,
  toMcpShape,
  fieldsByName,
} = require('../_airtable');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing task id' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const fields = fieldsByName(body.fields || {});

    const data = await airtableFetch(`${TASKS_TABLE}?returnFieldsByFieldId=true`, {
      method: 'PATCH',
      body: JSON.stringify({
        records: [{ id, fields }],
        typecast: true,
      }),
    });

    return res.status(200).json({ records: (data.records || []).map(toMcpShape) });
  } catch (err) {
    return sendError(res, err);
  }
};
