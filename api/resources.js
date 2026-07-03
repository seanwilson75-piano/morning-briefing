const { sendError, airtableFetch, toMcpShape } = require('./_airtable');

const RESOURCES_TABLE = process.env.AIRTABLE_RESOURCES_TABLE_ID || 'tblkL4LjP2YHIEj9n';

const RESOURCE_FIELDS = {
  fldyPb92h4DOwbfe1: 'Name',
  fldm3mp6gcwEsVOxW: 'URL',
  fldCcEts2Tn4vUIPa: 'Summary',
  fldeVI0z1NkndIHyZ: 'Where It Lives',
  fldaIoJgx3ClYG1xj: 'Type',
  fldZnG92mGC12jv5k: 'Status',
  fldJP9B9shrYVN9Ka: 'Added',
};

function fieldsByName(fields = {}) {
  const output = {};
  Object.entries(fields).forEach(([key, value]) => {
    output[RESOURCE_FIELDS[key] || key] = value;
  });
  return output;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const params = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
      const data = await airtableFetch(`${RESOURCES_TABLE}?${params.toString()}`);
      return res.status(200).json({ records: (data.records || []).map(toMcpShape) });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const fields = fieldsByName(body.fields || {});
      const data = await airtableFetch(`${RESOURCES_TABLE}?returnFieldsByFieldId=true`, {
        method: 'POST',
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
      return res.status(201).json({ records: (data.records || []).map(toMcpShape) });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
};
