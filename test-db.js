// Test Database Connection
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    console.log('Testing database connection...');
    console.log('DB Config:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASS ? '***hidden***' : 'NOT SET'
    });

    const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: console.log
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful!');
        
        // Test database existence
        const [results] = await sequelize.query("SELECT datname FROM pg_database WHERE datname = :dbname", {
            replacements: { dbname: process.env.DB_NAME },
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log('Database query result:', results);
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.original?.code);
        
        if (error.original?.code === 'ECONNREFUSED') {
            console.log('\n🔍 Troubleshooting:');
            console.log('1. Make sure PostgreSQL server is running');
            console.log('2. Check if the host/port is correct');
            console.log('3. Verify firewall settings');
        } else if (error.original?.code === '3D000') {
            console.log('\n🔍 Database does not exist. Need to create it first.');
        } else if (error.original?.code === '28P01') {
            console.log('\n🔍 Authentication failed. Check username/password.');
        }
    } finally {
        await sequelize.close();
    }
};

testConnection();