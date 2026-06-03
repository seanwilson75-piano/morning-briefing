const {
  PROJECTS_TABLE,
  sendError,
  airtableFetch,
  toMcpShape,
} = require('./_airtable');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const params = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
    const tablePath = encodeURIComponent(PROJECTS_TABLE);
    const requestPath = `${tablePath}?${params.toString()}`;

    const data = await airtableFetch(requestPath);
    const records = (data.records || []).map(toMcpShape);
    return res.status(200).json({ records });
  } catch (err) {
    return sendError(res, err);
  }
};
