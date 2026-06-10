import bcrypt from "bcrypt";

const run = async () => {
    const hash = await bcrypt.hash("admin321", 10);
    console.log(hash);
};

run();