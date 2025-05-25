import ApiError from '../helpers/ApiError';
import axios from 'axios';
import db from '../models';
import fs from 'fs';
import FormData from 'form-data';
import https from 'https';
import path from 'path';
import { google } from 'googleapis';
const readline = require('readline');

const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const User = db.User;
const School = db.School;
const CREDENTIALS_PATH = './credentials.json';
const TOKEN_PATH = './token.json';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const DRIVE_FOLDER_ID = '19pgbObsoKolDhcTjMWCfSDpHcqWEeBOi'; // Replace with your folder ID

class TeleBotService {
  async sendMessage(order) {
    const { TELE_BOT_TOKEN, TELE_CHAT_ID } = process.env;
    try {
      const existOrder = await Order.findOne({
        where: { id: order.id },
        attributes: ['id', 'total_amount'], // Select specific attributes for Order
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            attributes: ['quantity', 'price'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'unit'],
              },
            ],
          },
          {
            model: User,
            as: 'user',
            attributes: ['name'],
          },
          {
            model: School,
            as: 'school',
            attributes: ['name'],
          },
        ],
      });

      const orderJson = existOrder ? existOrder.toJSON() : null;
      if (
        !orderJson ||
        !orderJson.orderItems ||
        orderJson.orderItems.length === 0
      ) {
        return;
      }

      const formattedOrder = `
THỰC ĐƠN MỚI
Lúc: ${new Date().toLocaleString('vi-VN')}
Trường học: ${orderJson.school.name || 'Chưa xác định'}
Tổng: ${+orderJson.total_amount} VND
========================

SẢN PHẨM:
${orderJson.orderItems
          .map(
            (item) => `- ${item.product.name} (${item.quantity} ${item.product.unit})
................................`,
          )
          .join('\n')}`;

      const response = await axios.post(
        'https://discord.com/api/webhooks/1376246004365393991/vroFwWlexXyI9ETNwkwY7DljwFBdV2h3ymt9hYB17JDAe3X1w4xsowsdFvzr-szKayJe', {
        content: formattedOrder
      }
      );

      return response.data;
    } catch (error) {
      console.error('error', error.response.data);
      throw new ApiError(error.message, error.status);
    }
  }


  async sendFile(filePath) {
    const { TELE_BOT_TOKEN, TELE_CHAT_ID } = process.env;

    // Read the file from the provided filePath
    const fileStream = fs.createReadStream(filePath);
    // Create a FormData instance
    const form = new FormData();
    form.append('chat_id', TELE_CHAT_ID);
    form.append('document', fileStream);

    const agent = new https.Agent({ family: 4 });

    await axios.post(
      `https://api.telegram.org/bot${TELE_BOT_TOKEN}/sendDocument`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        httpsAgent: agent, // dùng IPv4
      }
    );
  }

  async sendPdfToDiscord(filePath) {
    const form = new FormData();
    form.append(
      'payload_json',
      JSON.stringify({
        content: '📎 File PDF đính kèm:',
        // username: 'Invoice Bot',
      })
    );

    form.append('file', fs.createReadStream(filePath), {
      contentType: 'application/pdf',
    });

    try {
      const response = await axios.post('https://discord.com/api/webhooks/1376252910177878036/RAR5h6qNw7cVZruy4V6MCLFsNuobDj_Imjl4k5cctCK9oRAC0Iv15gL3HL2CL9aYM6tj', form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      console.log('✅ Gửi file thành công', response.status);
    } catch (err) {
      console.error('❌ Gửi thất bại:', err.response?.status, err.response?.statusText);
      console.error(err.message);
    }
  };


  async authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Nếu token tồn tại thì load
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oAuth2Client.setCredentials(token);
      try {
        // Thử refresh để kiểm tra token có còn dùng được không
        await oAuth2Client.getAccessToken();
        return oAuth2Client;
      } catch (err) {
        console.error('Token cũ không hợp lệ. Xoá và tạo lại.', err.message);
        fs.unlinkSync(TOKEN_PATH);
      }
    }

    // Token chưa tồn tại hoặc bị hỏng -> tạo mới
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Truy cập đường dẫn này để xác thực:\n', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise((resolve) => {
      rl.question('Nhập code từ URL xác thực: ', (code) => {
        rl.close();
        resolve(code);
      });
    });

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Lưu token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Token đã lưu vào', TOKEN_PATH);

    return oAuth2Client;
  }

  async saveOnDrive(filePath) {
    try {
      const auth = await this.authorize();
      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: path.basename(filePath),
        parents: [DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(filePath),
      };

      const res = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, name, webViewLink',
      });

      console.log('✅ File uploaded to Drive:', res.data);
      return res.data; // Trả về link hoặc ID nếu cần
    } catch (error) {
      console.error('Error saving file to Google Drive:', error);
    }
  }
}

export default new TeleBotService();
