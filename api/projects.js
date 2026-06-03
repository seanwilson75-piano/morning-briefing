const {
  PROJECTS_TABLE,
  checkPassword,
  sendError,
  listAll,
} = require('./_airtable');

module.exports = async function handler(req, res) {
  if (!checkPassword(req)) return res.status(401).json({ error: 'Password required' });

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const records = await listAll(PROJECTS_TABLE);
    return res.status(200).json({ records });
  } catch (err) {
    return sendError(res, err);
  }
};
