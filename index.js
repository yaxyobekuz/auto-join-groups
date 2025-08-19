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
const stringSession = `1AgAOMTQ5LjE1NC4xNjcuNTEBuwwQGGih5I6el2K/vsl0/NeXo2ZHMHqUJF5cTlevVlWZt3nZ+MQWJNUDXGNFP7PD6kjPC/N9+4QwvYzEYkMp8HT4qgpB6T+k9ZgFdrjSZbkOo+mF1yZFQyM7b16lMmf1rqdSPTx88hurRcF+jsKqBYd9nEp5ONSjNIu6JEmg22ZY3EFWHyOcobYL1w7zfPTR6wF3bcNz/QomMKrpqbXoFtCtLOc4oIINRw9/xfKcrdv6rhosLIgmPQBol7yTr9LYBNFe/TJWxoRH8rqgpKDmJMoX+FApnpZhwE5Mf/BCfMAyoz62hzu0xicaoEGGecpwli06ZA7ChcGy170Uw79ur98=`;

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
        Username.findOneAndDelete({ username });
      }

      if (members < 4000 || members > 185000) {
        console.log(
          `${
            count + index
          }. Foydalanuvchi chatga qo'shilmadi: A'zolar ko'p yoki kam: ${members?.toLocaleString()} ta`
        );
        continue;
      }

      Username.findOneAndUpdate({ username }, { members });

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
