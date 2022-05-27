const fs = require('fs');
const https = require('https');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const post_options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
}

config.target.forEach(target => {
  let saved = null;
  const saved_dir = '.cache/' + target.key;
  const saved_file = saved_dir + '/saved.json';
  if (fs.existsSync(saved_dir)) {
    if (fs.existsSync(saved_file)) {
      saved = JSON.parse(fs.readFileSync(saved_file, 'utf8'));
    } else {
    }
  } else {
    fs.mkdir(saved_dir, (err) => {
      if (err) { throw err;}
    });
  }
  let last_comment_date = Date.parse('2022/05/27 15:00');
  if (saved !== null) {
    last_comment_date = Date.parse(saved.bookmarks.sort((a, b) => {
      return Date.parse(b.timestamp) - Date.parse(a.timestamp);
    })[0].timestamp);
  }
  console.log({last_comment_date});

  const comments = [];

  // const get_options = {
  //   hostname: config.api_host,
  //   path: config.api_path + target.url,
  //   headers: {
  //     'User-Agent': 'Mozilla/5.0'
  //   }
  // }
  // console.log(get_options);
  https.get(config.api_url + target.url, (res) => {
    let data = ''; 

    // A chunk of data has been received. 
    res.on('data', (chunk) => { 
        data += chunk; 
    }); 

    // The whole response has been received. Print out the result. 
    res.on('end', () => { 
        const json = JSON.parse(data);
        const bookmarks = json.bookmarks.sort((a, b) => {
          return Date.parse(a.timestamp) - Date.parse(b.timestamp);
        });
        bookmarks.filter(b => Date.parse(b.timestamp) > last_comment_date).forEach(b => {
          comments.push(b);
          console.log(b);
        });
        fs.writeFileSync(saved_file, JSON.stringify(json), 'utf8');

        if (comments.length === 0) {
          console.log('No new comments for: ', json.title);
        }
      
        comments.forEach(c => {
          const body = JSON.stringify({
            "username": `${c.user} : ${json.title}`,
            "avatar_url": config.avatar_url,
            "content": c.comment
          });
          const request = https.request(config.discord_webhook_url, post_options);
          request.write(body);
          request.end();
          console.log('posted: ', body);
        });
    }); 
  });
});
