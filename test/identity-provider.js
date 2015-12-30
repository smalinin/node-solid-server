var assert = require('chai').assert
var fs = require('fs')
var $rdf = require('rdflib')
var request = require('request')
var S = require('string')
var supertest = require('supertest')
var async = require('async')

// Helper functions for the FS
var rm = require('./test-utils').rm
var write = require('./test-utils').write
var cp = require('./test-utils').cp
var read = require('./test-utils').read

var ldnode = require('../index')

describe('Identity Provider', function () {
  this.timeout(10000)

  var address = 'https://localhost:3457'

  var ldpHttpsServer
  var ldp = ldnode.createServer({
    root: __dirname + '/resources',
    key: __dirname + '/keys/key.pem',
    cert: __dirname + '/keys/cert.pem',
    webid: true,
    idp: __dirname + '/resources/accounts/',
    host: 'localhost:3457'
  })

  var ldpHttpsServer
  before(function (done) {
      ldpHttpsServer = ldp.listen(3457, done)
  })

  after(function () {
      if (ldpHttpsServer) ldpHttpsServer.close()
  })

  var server = supertest(address)
  var user1 = 'https://user1.databox.me/profile/card#me'
  var user2 = 'https://user2.databox.me/profile/card#me'

  var userCredentials = {
    user1: {
      cert: fs.readFileSync(__dirname + '/keys/user1-cert.pem'),
      key: fs.readFileSync(__dirname + '/keys/user1-key.pem')
    },
    user2: {
      cert: fs.readFileSync(__dirname + '/keys/user2-cert.pem'),
      key: fs.readFileSync(__dirname + '/keys/user2-key.pem')
    }
  }

  it('should redirect to signup on GET /accounts', function (done) {
    server.get('/accounts')
      .expect(302, done)
  })

  describe('Creating an account with POST', function () {
    it('should return 406 if username is not given', function (done) {
      server.post('/accounts')
        .expect(406, done)
    })
    it('should return create WebID if only username is given', function (done) {
      server.post('/accounts')
        .send('username=nicola')
        .expect(201)
        .end(function (err) {
          rm('accounts/nicola.localhost:3457')
          done(err)
        })
    })
    it('should not create an account if the account already exists', function (done) {
      server.post('/accounts')
        .send('username=nicola')
        .expect(201)
        .end(function (err) {
          if (err) {
            return done(err)
          }
          server.post('/accounts')
            .send('username=nicola')
            .expect(406)
            .end(function (err) {
              rm('accounts/nicola.localhost:3457')
              done(err)
            })
        })
    })
  })
})
