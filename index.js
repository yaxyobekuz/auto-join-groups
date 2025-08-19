require("dotenv").config();

// Db
const connectDB = require("./src/db/connectDB");

// Models
const Count = require("./src/models/Count");
const Username = require("./src/models/Username");

// Tg
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

// Tg api credintials
const apiHash = process.env.API_HASH;
const apiId = Number(process.env.API_ID);
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const stringSession = `1AgAOMTQ5LjE1NC4xNjcuNTEBu7Dq1j69dtB43J0kVvnTkRwA1a3M6bA32O5yqY9h9v3HLCaJzyNhyyCm72sRSEW2diA0QwmrFSkVrn8fBgesf7SWdqd0EJ5oDKGSfNek3tgXg0BYerI2qInlHSG5LbiI0KUXmPIeMrnXom/vYF5W+3cWSXlVD8QvG/+xJy3Cftkkhq/yVI8FFFv+u1JVCHiDTQVpH1pqQQpGs5Hwvdhkb40CSyhSHpHuADBhPKS8IvQYEvidvPb+9S4kAslOd9G87yxF1SWYPS26RE5m7zrCCbYA67OtvlTbRBvyqEWxAlLQFF3V/tBn2c3DBYWCd+jwJrhsf0V3ctX+G74FiNiFpms=`;

const joinChat = async ({ client, username }) => {
  try {
    const res = await client.invoke(
      new Api.channels.JoinChannel({ channel: username })
    );

    return res;
  } catch (error) {
    return error?.errorMessage;
  }
};

const getChatMembersCount = async ({ client, username }) => {
  try {
    const entity = await client.getEntity(username);
    const channel = await client.invoke(
      new Api.channels.GetFullChannel({ channel: entity })
    );
    await delay(2000);

    return channel?.fullChat?.participantsCount || 0;
  } catch {
    return 0;
  }
};

const start = async () => {
  const session = new StringSession(stringSession);
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  const joinChats = async () => {
    const { count } = await Count.findOne();
    const usernames = await Username.find().skip(count).limit(25);

    let index = 0;
    let joined = 0;
    let deleted = 0;

    for (let { username } of usernames) {
      index++;
      if (joined === 10) break;

      const members = await getChatMembersCount({ client, username });

      if (members < 2000 || members > 195000) {
        deleted++;
        await Username.findOneAndDelete({ username });
      }

      if (members < 4000 || members > 185000) {
        console.log(
          `${
            count + index
          }. Foydalanuvchi chatga qo'shilmadi: A'zolar ko'p yoki kam: ${members?.toLocaleString()} ta`
        );
        continue;
      }

      await Username.findOneAndUpdate({ username }, { members }, { new: true });

      const res = await joinChat({ client, username });
      const chats = res?.chats;
      const number = count + index;

      const status =
        (chats ? res?.chats[0]?.title : null) ||
        (res === "INVITE_REQUEST_SENT" ? username : null);

      if (res === "FLOOD") {
        console.log(`${number}. Foydalanuvchi chatga qo'shilmadi: Muzlatish`);
        continue;
      }

      if (!status) {
        console.log(`${number}. Foydalanuvchi chatga qo'shilmadi: ${res}`);
        continue;
      }

      joined++;
      console.log(`${number}. Foydalanuvchi ${status}'ga qo'shildi!`);
    }

    console.log(`Foydalanuvchi jami ${joined}ta chatga qo'shildi!`);
    await Count.updateOne({}, { $inc: { count: index - deleted, joined } });
  };

  const runInterval = async () => {
    await joinChats();
    const { joined } = await Count.findOne();
    if (joined > 100) {
      return console.log("Stop: 100 ta chatga qo'shildi.");
    }

    setTimeout(runInterval, 1000 * 60 * 25);
  };

  runInterval();
};

(async () => {
  await connectDB();
  await start();
})();
