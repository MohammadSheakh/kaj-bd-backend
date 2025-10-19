//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import dotenv from 'dotenv';
import { User } from '../modules/user.module/user/user.model';
import { UserProfile } from '../modules/user.module/userProfile/userProfile.model';
import { TSubscription } from '../enums/subscription';
// Load environment variables
dotenv.config();

// Sample data for default users
const usersData = [
  {
    name: 'Admin',
    email: 'a@gmail.com',
    password: '$2b$12$cxPF29g99duEaWshhIjW6.TXTEzCccwZaL8jil3gFvhMjogg4HxiW', // Hashed password asdfasdf
    role: 'admin',
    isEmailVerified: true,
    isDeleted: false,
    isResetPassword:false,
    failedLoginAttempts : 0,
  },
];

// Function to drop the entire database
const dropDatabase = async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log('------------> Database dropped successfully! <------------');
  } catch (err) {
    console.error('Error dropping database:', err);
  }
};

// Function to seed users
const seedUsers = async () => {
  try {
    await User.deleteMany({});
    await UserProfile.deleteMany({});

    for (const userData of usersData) {
      // 1. Create UserProfile
      const userProfile = await UserProfile.create({
        acceptTOC: true,
        // Note: if your schema requires userId, you'll need to update it later
      });

      // 2. Create User with profileId
      await User.create({
        ...userData, 
        profileId: userProfile._id,
      });

      // 3. If UserProfile requires userId, update it now:
      // await UserProfile.findByIdAndUpdate(userProfile._id, { userId: user._id });
    }

    console.log('Users seeded successfully!');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const dbUrl = process.env.MONGODB_URL;
    if (!dbUrl) throw new Error('MONGODB_URL not set in environment variables');

    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit process with failure
  }
};

// Main function to seed the database
const seedDatabase = async () => {
  try {
    await connectToDatabase();
    await dropDatabase();
    await seedUsers();
    console.log('--------------> Database seeding completed <--------------');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect().then(() => console.log('Disconnected from MongoDB'));
  }
};

// Execute seeding
seedDatabase();
