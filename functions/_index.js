
'use strict';

const functions = require('firebase-functions');
const mastodon = require('mastodon');
const express = require('express');
const cors = require('cors')({origin: true});
const app = express();

var mstdn = new mastodon({
  access_token: '[MASTODON_ACCESS_TOKEN]',
  timeout_ms: 5*1000,
  api_url: '[MASTODON_API_URL]', // optional, defaults to https://mastodon.social/api/v1/
});

exports.get = functions.https.onRequest((request, response) => {
    const tag = request.query.tag ? request.query.tag : 'biwakomap';
    const limit = request.query.limit ? request.query.limit : '40';
    const max_id = request.query.max_id ? request.query.max_id : '';
    cors(request, response, () => {
        mstdn.get('timelines/tag/'+encodeURIComponent(tag)+'?limit='+limit+'&max_id='+max_id, function(err, data, res) {
            response.send(data);
        });
    })
})