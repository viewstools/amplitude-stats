let request = require('request')
let unzipper = require('unzipper')
let zlib = require('zlib')

module.exports = async function main(req, res) {
  res.json(
    await new Promise((resolve, reject) => {
      let entries = []
      request
        .get(
          `https://${req.query.key}:${req.query.secret}@amplitude.com/api/2/export?start=${req.query.start}&end=${req.query.end}`
        )
        .pipe(unzipper.Parse())
        .on('entry', entry => {
          console.log({ type: 'entry', path: entry.path })

          entries.push(
            new Promise(async resolve => {
              let buffer = await entry.buffer()
              zlib.gunzip(buffer, (_, buffer) => {
                resolve(
                  buffer
                    .toString()
                    .split('\n')
                    .filter(Boolean)
                    .map(l => JSON.parse(l))
                )
              })
            })
          )
        })
        .on('finish', async () => {
          resolve(await Promise.all(entries))
        })
        .on('error', reject)
    })
  )
}
