import ApiError from '../helpers/ApiError';
import axios from 'axios';
import db from '../models';
import fs from 'fs';
import FormData from 'form-data';
import https from 'https';
import path from 'path';
import { google } from 'googleapis';

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
        `https://api.telegram.org/bot${TELE_BOT_TOKEN}/sendMessage`,
        {
          chat_id: TELE_CHAT_ID,
          text: formattedOrder,
        },
        {
          family: 4, // <-- thêm dòng này
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
    form.append('chat_id', TELE_CHAT_ID );
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

  async authorize() {
    try {
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
      const { client_secret, client_id, redirect_uris } = credentials.web;

      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris && redirect_uris[0] ? redirect_uris[0] : 'http://localhost'
      );

      if (fs.existsSync(TOKEN_PATH)) {
        oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
        return oAuth2Client;
      }
    } catch (error) {
      throw new Error('token.json not found. Please authenticate first.');
    }
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
