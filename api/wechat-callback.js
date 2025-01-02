const axios = require('axios');
const crypto = require('crypto');

// 微信配置
const APP_ID = 'wx471126d787432ddd';
const APP_SECRET = 'e5f0749f629f7e5204c7ecdaf8508f98';
const TOKEN = 'lslxwdh5test';  // 微信 Token

module.exports = async (req, res) => {
  // 处理微信验证请求（用于Token校验）
  if (req.method === 'GET') {
    const { signature, timestamp, nonce, echostr } = req.query;

    // 微信签名验证逻辑
    const arr = [TOKEN, timestamp, nonce].sort();
    const str = arr.join('');
    const hash = crypto.createHash('sha1').update(str).digest('hex');

    if (hash === signature) {
      // 返回echostr，表明成功接入
      return res.send(echostr);
    } else {
      return res.send('Signature verification failed');
    }
  }

  // 处理微信授权回调请求（用于获取access_token和openid）
  if (req.method === 'POST') {
    const { code } = req.query;  // 获取微信返回的code

    if (!code) {
      return res.status(400).send('Missing code');
    }

    try {
      // 请求微信接口获取 access_token 和 openid
      const response = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
        params: {
          appid: APP_ID,
          secret: APP_SECRET,
          code,
          grant_type: 'authorization_code',
        },
      });

      const { access_token, openid } = response.data;

      if (!access_token || !openid) {
        return res.status(400).send('Failed to get access token or openid');
      }

      // 使用 access_token 和 openid 获取用户信息
      const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
        params: {
          access_token,
          openid,
          lang: 'zh_CN',
        },
      });

      const userInfo = userInfoResponse.data;
      // 返回用户信息
      return res.json(userInfo);
    } catch (error) {
      return res.status(500).send('Error occurred while getting access token or user info');
    }
  }

  // 默认返回 404
  res.status(404).send('Not Found');
};
