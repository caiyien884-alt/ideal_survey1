// 引入Node.js的http模組和mysql2模組
const http = require('http');
const mysql = require('mysql2');
const os = require('os'); // Add os module to get network interfaces

// 建立MySQL資料庫連線
const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root', // 請替換為您的MySQL使用者名稱
  password: 'Nbaby555', // 請替換為您的MySQL密碼
  database: 'ideal_survey'
});

// 連接到資料庫
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');
});

// 建立一個HTTP伺服器
const server = http.createServer((req, res) => {
  // 設定CORS headers讓網頁可以跨域訪問
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理預檢請求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 解析請求內容
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  // 請求處理完成後執行
  req.on('end', () => {
    // 判斷請求的URL路徑
    if (req.url === '/' && req.method === 'GET') {
      // 如果是根路徑，回傳200狀態碼和JSON內容類型的回應標頭
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({message: 'Welcome to Survey API'}));
      
    } else if (req.url === '/users' && req.method === 'GET') {
      // 取得所有使用者
      const query = 'SELECT * FROM Users';
      db.query(query, (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else if (req.url === '/users' && req.method === 'POST') {
      // 新增使用者
      try {
        const userData = JSON.parse(body);
        const query = 'INSERT INTO Users (anonymous_id, gender, age_group) VALUES (?, ?, ?)';
        const values = [userData.anonymous_id, userData.gender, userData.age_group];
        
        db.query(query, values, (error, results) => {
          if (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: error.message}));
            return;
          }
          res.writeHead(201, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({id: results.insertId, ...userData}));
        });
      } catch (e) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid JSON'}));
      }
      
    } else if (req.url.match(/^\/users\/\d+\/responses$/) && req.method === 'GET') {
      // 取得特定使用者的所有回應
      const userId = req.url.split('/')[2];
      const query = `
        SELECT r.id, r.user_id, r.question_id, q.text as question_text, r.option_id, o.option_text, r.answer_text 
        FROM Responses r
        LEFT JOIN Questions q ON r.question_id = q.id
        LEFT JOIN Options o ON r.option_id = o.id
        WHERE r.user_id = ?
      `;
      db.query(query, [userId], (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else if (req.url.match(/^\/questions\/\d+\/responses$/) && req.method === 'GET') {
      // 取得特定問題的所有回應
      const questionId = req.url.split('/')[2];
      const query = `
        SELECT r.id, r.user_id, u.anonymous_id, r.question_id, r.option_id, o.option_text, r.answer_text 
        FROM Responses r
        LEFT JOIN Users u ON r.user_id = u.id
        LEFT JOIN Options o ON r.option_id = o.id
        WHERE r.question_id = ?
      `;
      db.query(query, [questionId], (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else if (req.url === '/questions' && req.method === 'GET') {
      // 取得所有問題
      const query = 'SELECT * FROM Questions';
      db.query(query, (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else if (req.url === '/options' && req.method === 'GET') {
      // 取得所有選項
      const query = 'SELECT * FROM Options';
      db.query(query, (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else if (req.url === '/responses' && req.method === 'GET') {
      // 取得所有回應
      const query = `
        SELECT r.id, r.user_id, u.anonymous_id, r.question_id, q.text as question_text, 
               r.option_id, o.option_text, r.answer_text 
        FROM Responses r
        LEFT JOIN Users u ON r.user_id = u.id
        LEFT JOIN Questions q ON r.question_id = q.id
        LEFT JOIN Options o ON r.option_id = o.id
      `;
      db.query(query, (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else if (req.url === '/responses' && req.method === 'POST') {
      // 新增回應 - 保留原功能
      try {
        const responseData = JSON.parse(body);
        
        // 验证必要字段
        if (!responseData.user_id || !responseData.question_id) {
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: 'user_id and question_id are required'}));
          return;
        }
        
        // 如果提供了 option_id，查询对应的选项文本
        let answerText = null;
        if (responseData.option_id) {
          const query = 'SELECT option_text FROM Options WHERE id = ?';
          db.query(query, [responseData.option_id], (error, results) => {
            if (error) {
              res.writeHead(500, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({error: error.message}));
              return;
            }
            
            if (results.length > 0) {
              answerText = results[0].option_text;
            }
            
            // 插入答案到响应表
            const insertQuery = 'INSERT INTO Responses (user_id, question_id, option_id, answer_text) VALUES (?, ?, ?, ?)';
            const values = [responseData.user_id, responseData.question_id, responseData.option_id, answerText];
            
            db.query(insertQuery, values, (error, results) => {
              if (error) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: error.message}));
                return;
              }
              res.writeHead(201, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({id: results.insertId, ...responseData}));
            });
          });
        } else {
          // 没有选项ID，直接插入答案文字
          const query = 'INSERT INTO Responses (user_id, question_id, option_id, answer_text) VALUES (?, ?, ?, ?)';
          const values = [responseData.user_id, responseData.question_id, null, responseData.answer_text || null];
          
          db.query(query, values, (error, results) => {
            if (error) {
              res.writeHead(500, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({error: error.message}));
              return;
            }
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({id: results.insertId, ...responseData}));
          });
        }
      } catch (e) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid JSON'}));
      }
      
    } else if (req.url === '/answers' && req.method === 'POST') {
      // 新增答案 - 專門用於提交問題答案
      try {
        const answerData = JSON.parse(body);
        
        // 驗證必要字段
        if (!answerData.user_id || !answerData.question_id) {
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: 'user_id and question_id are required'}));
          return;
        }
        
        // 驗證使用者是否存在
        db.query('SELECT id FROM Users WHERE id = ?', [answerData.user_id], (error, userResults) => {
          if (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: error.message}));
            return;
          }
          
          if (userResults.length === 0) {
            res.writeHead(400, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'User does not exist'}));
            return;
          }
          
          // 驗證問題是否存在
          db.query('SELECT id FROM Questions WHERE id = ?', [answerData.question_id], (error, questionResults) => {
            if (error) {
              res.writeHead(500, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({error: error.message}));
              return;
            }
            
            if (questionResults.length === 0) {
              res.writeHead(400, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({error: 'Question does not exist'}));
              return;
            }
            
            // 如果提供了選項ID，驗證選項是否存在且屬於當前問題
            if (answerData.option_id) {
              db.query('SELECT id FROM Options WHERE id = ? AND question_id = ?', 
                      [answerData.option_id, answerData.question_id], (error, optionResults) => {
                if (error) {
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({error: error.message}));
                  return;
                }
                
                if (optionResults.length === 0) {
                  res.writeHead(400, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({error: 'Option does not exist or does not belong to the question'}));
                  return;
                }
                
                // 插入答案到回應表
                const query = 'INSERT INTO Responses (user_id, question_id, option_id, answer_text) VALUES (?, ?, ?, ?)';
                const values = [answerData.user_id, answerData.question_id, answerData.option_id, answerData.answer_text || null];
                
                db.query(query, values, (error, results) => {
                  if (error) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: error.message}));
                    return;
                  }
                  res.writeHead(201, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({id: results.insertId, ...answerData}));
                });
              });
            } else {
              // 沒有選項ID，直接插入答案文字
              const query = 'INSERT INTO Responses (user_id, question_id, option_id, answer_text) VALUES (?, ?, ?, ?)';
              const values = [answerData.user_id, answerData.question_id, null, answerData.answer_text || null];
              
              db.query(query, values, (error, results) => {
                if (error) {
                  res.writeHead(500, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({error: error.message}));
                  return;
                }
                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({id: results.insertId, ...answerData}));
              });
            }
          });
        });
        
      } catch (e) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid JSON'}));
      }
      
    } else if (req.url.match(/^\/questions\/\d+\/options$/) && req.method === 'GET') {
      // 取得特定問題的選項
      const questionId = req.url.split('/')[2];
      const query = 'SELECT * FROM Options WHERE question_id = ?';
      db.query(query, [questionId], (error, results) => {
        if (error) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: error.message}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
      });
      
    } else {
      // 如果請求的URL不符合任何API端點，回傳404狀態碼
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: 'Endpoint not found'}));
    }
  });
});

// Function to get the server's IP address
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interface = interfaces[interfaceName];
    for (const config of interface) {
      // Skip over internal (lo) and IPv6 addresses
      if (!config.internal && config.family === 'IPv4') {
        return config.address;
      }
    }
  }
  return 'localhost'; // fallback
}

// 設定伺服器監聽的埠號
const port = 3001;
// 啟動伺服器，並在伺服器啟動後印出伺服器運行的位置
server.listen(port, '0.0.0.0', () => {
  const serverIP = getServerIP();
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Server is accessible from other computers at http://${serverIP}:${port}/`);
});