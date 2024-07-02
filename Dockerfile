FROM node:14.17.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# EXPOSE 3000
# Không cần khai báo vì docker compose đã có 

# VOLUME /usr/src/app
# Mount the current directory to the container directory
# Không cần khai báo vì docker compose đã khai báo

# CMD ["npm", "run", "start"]
# Định nghĩa lệnh mặc định sẽ được chạy khi container khởi động
# Khi dùng lệnh "command" ở docker compose nó sẽ thay thế cho bất kỳ lệnh CMD nào trong Dockerfile 
