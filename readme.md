Tạo mới model: npx sequelize-cli model:generate --name Car --attributes name:string,color:string,manufacturer:string
Format lại code: npm run format
Khởi chạy local - dev: npm run dev
Khởi tạo db: npm run migrate

//Huy note nestjs
@ManyToOne(() => Users, (user) => user.refreshTokens)
@JoinColumn([{ name: 'user_id', referencedColumnName: 'user_id' }])
user: Users;

@Column({ name: 'user_id' })
user_id: number;
