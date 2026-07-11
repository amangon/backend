
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const img = (seed) => ({
  url: `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`,
  publicId: `seed-placeholder-${seed}`,
});

const run = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@luxuryjewellery.com";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
      role: "admin",
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  const defaultCategories = ["Necklaces", "Rings", "Earrings", "Bracelets"];
  const categoryDocs = {};
  for (const name of defaultCategories) {
    let cat = await Category.findOne({ name });
    if (!cat) {
      cat = await Category.create({ name });
      console.log(`Category created: ${name}`);
    }
    categoryDocs[name] = cat;
  }

   const existingProductCount = await Product.countDocuments();

if (existingProductCount > 0) {
  console.log("Adding new products...");
} else {
    const sampleProducts = [
      { name: "Diamond Solitaire Necklace", category: "Necklaces", price: 45000, discountPrice: 39999, material: "18K Gold", gemstone: "Diamond", stock: 12, isFeatured: true, isNewArrival: true, image: "photo-1599643478518-a784e5dc4c8f" },
      { name: "Pearl Drop Necklace", category: "Necklaces", price: 18500, stock: 20, isBestSeller: true, image: "photo-1611591437281-460bfbe1220a" },
      { name: "Emerald Halo Ring", category: "Rings", price: 62000, discountPrice: 54999, material: "Platinum", gemstone: "Emerald", stock: 8, isFeatured: true, isBestSeller: true, image: "photo-1605100804763-247f67b3557e" },
      { name: "Classic Gold Band", category: "Rings", price: 22000, stock: 25, isNewArrival: true, image: "photo-1605100804763-247f67b3557e" },
      { name: "Sapphire Stud Earrings", category: "Earrings", price: 28500, material: "White Gold", gemstone: "Sapphire", stock: 15, isFeatured: true, image: "photo-1535632066927-ab7c9ab60908" },
      { name: "Rose Gold Hoop Earrings", category: "Earrings", price: 15900, stock: 30, isBestSeller: true, isNewArrival: true, image: "photo-1535632066927-ab7c9ab60908" },
      { name: "Tennis Bracelet", category: "Bracelets", price: 51000, discountPrice: 46500, material: "18K Gold", gemstone: "Diamond", stock: 10, isFeatured: true, image: "photo-1611591437281-460bfbe1220a" },
      { name: "Charm Chain Bracelet", category: "Bracelets", price: 12500, stock: 40, isNewArrival: true, image: "photo-1599643478518-a784e5dc4c8f" },
    ];

    for (const p of sampleProducts) {
      await Product.create({
        name: p.name,
        description: `A timeless ${p.name.toLowerCase()} crafted with meticulous attention to detail, designed for lasting elegance.`,
        shortDescription: `${p.material || "Fine"} ${p.category.toLowerCase().slice(0, -1)}`,
        category: categoryDocs[p.category]._id,
        price: p.price,
        discountPrice: p.discountPrice || 0,
        material: p.material || "",
        gemstone: p.gemstone || "",
        stock: p.stock,
        images: [img(p.image)],
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNewArrival: !!p.isNewArrival,
      });
      console.log(`Product created: ${p.name}`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});