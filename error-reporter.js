var reporter = require('./reporter')
var os = require('os')

function errorHelp (e, app) {
  var howToFix

  switch (e.code) {
    case 'EADDRINUSE': {
      howToFix = {
        win32: [
          'Run cmd.exe as administrator\n',
          'C:\\> netstat -a -b -n -o',
          'C:\\> taskkill /F /PID <processid>'
        ],
        linux: [
          `$ su - root -c 'netstat -nlp | grep ${ e.port }'`,
          `tcp  0  0.0.0.0:${ e.port }  0.0.0.0:*  LISTEN  777/node`,
          '$ sudo kill -9 777'
        ],
        // macos
        darwin: [
          `$ sudo lsof -i ${ e.port }`
          // TODO: write an explanation
        ]
        // TODO: describe 'aix', 'freebsd', 'openbsd', 'sunos'
      }

      return {
        description: `Port :${ e.port } is busy`,
        hint: [
          'In other words there is a program already listening on the port.',
          'To fix the issue, you should first find the process, then kill it.'
        ],
        solution: howToFix[os.platform()] || ''
      }
    }

    case 'EACCES':
      howToFix = {
        development: [
          'Seems that you are in the development mode, use sudo ;)',
          '$ sudo npm start'
        ],
        production: [
          '$ su - <username>',
          `$ npm start -p ${ e.port }`
        ]
      }

      return {
        description: `You are not allowed to run server on port :${ e.port }`,
        hint: [
          'Non-privileged users can\'t start a listening socket',
          'on ports below 1024. Try to change user or take another port.'
        ],
        solution: howToFix[app.env] || howToFix['production']
      }
    default:
      throw e
  }
}

module.exports = function errorReporter (err, app) {
  var c = reporter.color(app)
  var help = errorHelp(err, app)
  var explanation = [].concat('', help.hint, '', help.solution)

  return reporter.message([
    reporter.error(c, help.description),
    reporter.hint(c, explanation)
  ])
}
