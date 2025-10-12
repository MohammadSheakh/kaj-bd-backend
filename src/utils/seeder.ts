//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import dotenv from 'dotenv';
import { User } from '../modules/user/user.model';
import { UserProfile } from '../modules/user/userProfile/userProfile.model';
import { TSubscription } from '../enums/subscription';
// Load environment variables
dotenv.config();

// Sample data for default users
const usersData = [
  {
    name: 'Admin',
    email: 'a@gmail.com',
    password: '$2b$12$cxPF29g99duEaWshhIjW6.TXTEzCccwZaL8jil3gFvhMjogg4HxiW', // Hashed password asdfasdf
    // profileImage: {
    // imageUrl: "/uploads/users/user.png",
    //   _id: {
    //     $oid: "68982eb2d5f4042c5c0bbb94"
    //   }
    // },
    subscriptionType: TSubscription.vise,
    fcmToken: null,
    status: 'active',
    role: 'admin',
    isEmailVerified: true,
    isDeleted: false,
    isResetPassword:false,
    failedLoginAttempts : 0,
    stripe_customer_id : null,
    stripeConnectedAccount : "",
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
    await User.deleteMany();
    // await User.insertMany(usersData);

    // Create UserProfiles
    const userProfiles = await UserProfile.insertMany(
      usersData.map((_, index) => ({
        approvalStatus: 'pending',
        description: `${usersData[index].name}'s profile`,
        attachments: [],
        protocolNames: [],
        howManyPrograms: 0,
      }))
    );

    // Create Users with hashed passwords and linked profileId
    const usersWithProfileIds = usersData.map((userData, index) => ({
      ...userData,
      // password: hashedPasswords[index], // ✅ Hashed
      profileId: userProfiles[index]._id,
    }));
    
    await User.insertMany(usersWithProfileIds);

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
