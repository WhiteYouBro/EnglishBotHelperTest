const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = '8125764878:AAHKwqCtYKeYcXDoG8x09mapynEq-m_WxF8'; // токен бота
const bot = new TelegramBot(token, { polling: true });
const KeepAlive = require('./keep_alive.js');

const requiredChannel = '-1001857511663'; // заменить на id канала который нужно чтоб человек был подписан
const requiredChannelLink = "https://t.me/AmericaninSPB"; // а здесь просто ссылка на канал

const testQuestions = [
  {
    question: '1/25 How old are you?',
    options: ['I is 25.', 'I have 25.', 'I am 25.'],
    correct: 2
  },
  {
    question: '2/25 Do you work on Fridays?',
    options: ['Yes, I work.', 'Yes, I do.', 'Yes, I am.'],
    correct: 1
  },
  {
    question: '3/25 Do you have a brother?',
    options: ['No, I not have.', 'No, me don’t.', 'No, I don’t.'],
    correct: 2
  },
  {
    question: '4/25 I’m going to the shop. ________ you like to come?',
    options: ['Do', 'Are', 'Would'],
    correct: 2
  },
  {
    question: '5/25 I’d like ____ sugar in my coffee.',
    options: ['Some', 'Any', 'A'],
    correct: 0
  },
  {
    question: '6/25 _ a hospital near here?',
    options: ['There is', 'Is there', 'There are'],
    correct: 1
  },
  {
    question: '7/25 Have you finished _ the kitchen yet?',
    options: ['to clean', 'cleaning', 'cleaned'],
    correct: 1
  },
  {
    question: '8/25 She drove the car _ the garage.',
    options: ['between', 'out of', 'down'],
    correct: 1
  },
  {
    question: '9/25 He ___ very fast when the police _ him.',
    options: ['drove / stop', 'was driving / stopped', 'has drove / was stopping'],
    correct: 1
  },
  {
    question: '10/25 He is good at his job so he ____ a lot of money.',
    options: ['Makes', 'Does', 'Have'],
    correct: 0
  },
  {
    question: '11/25 Do you _ coffee? Yes, but _ to quit.',
    options: ['drink / I’m trying', 'drinking / I try', 'drunk / I’m trying'],
    correct: 0
  },
  {
    question: '12/25 I hurt my leg ____ I was playing football.',
    options: ['During', 'while', 'for'],
    correct: 1
  },
  {
    question: '13/25 This coffee tastes __ the other.',
    options: ['sweeter than', 'more sweet than', 'more sweeter than'],
    correct: 0
  },
  {
    question: '14/25 David _ in that industry for many years so a lot of contacts.',
    options: ['is working', 'has been working', 'have worked'],
    correct: 1
  },
  {
    question: '15/25 _ my leg. I broke it while playing football with my brother.',
    options: ['I’ve broken / I broke', 'Broke / I’ve broken'],
    correct: 0
  },
  {
    question: '16/25 When my brother was 20 he  in an apartment in London. At that time, he  at HSBC.',
    options: ['used to live / was working', 'had lived / worked', 'would live / had worked'],
    correct: 0
  },
  {
    question: '17/25 I  an umbrella with me this morning because it __.',
    options: ['didn’t take / rained', 'took / was raining', 'took / have rained'],
    correct: 1
  },
  {
    question: '18/25 __ your question about our services, I have attached a document where you can see all necessary details.',
    options: ['As far as', 'Where as', 'Regarding'],
    correct: 2
  },
  {
    question: '19/25 If only I __ that you wanted to meet her.',
    options: ['I know', 'had known', 'have known'],
    correct: 1
  },
  {
    question: '20/25 We’d better find a quick solution to this crisis, __ all our customers will start to lose faith in us.',
    options: ['in fact', 'otherwise', 'after all'],
    correct: 1
  },
  {
    question: '21/25 The family was shocked that the crime happened in _ daylight.',
    options: ['wide', 'large', 'broad'],
    correct: 2
  },
  {
    question: '22/25 Tony has had his motorbike...',
    options: ['when he passed his driving test.', 'since he passed his driving test.', 'as he passed his driving test.'],
    correct: 1
  },
  {
    question: '23/25 I always get _____ before an important meeting.',
    options: ['butterflies in my stomach', 'All ears', 'A lot on one’s plate'],
    correct: 0
  },
  {
    question: '24/25 Don’t buy a car from there they will _ you _.',
    options: ['Rip off', 'Mess up', 'Lay off'],
    correct: 0
  },
  {
    question: '25/25 If you cancel now you’ll _ all my arrangements.',
    options: ['Check out', 'Knuckle down', 'Mess up'],
    correct: 2
  },
];
const userSessions = {}; //  состояния пользователей
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 час для неактивности (после идёт сброс)

//проверка подписки
async function checkSubscription(userId) {
  try {
    const chatMember = await bot.getChatMember(requiredChannel, userId);
    return ['member', 'administrator', 'creator'].includes(chatMember.status);
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Функция определения уровня английского
function determineLevel(score) {
  if (score <= 5) return 'A1 (Начальный уровень)';
  if (score <= 10) return 'A2 (Элементарный уровень)';
  if (score <= 15) return 'B1 (Средний уровень)';
  if (score <= 20) return 'B2 (Выше среднего уровня)';
  return 'C1 (Продвинутый уровень)';
}

function getLevelDescription(level) {
  const descriptions = {
    'A1 (Начальный уровень)': '📘 Вы можете понимать и использовать основные фразы. Поработайте над словарным запасом! 💪',
    'A2 (Элементарный уровень)': '📗 Вы можете общаться на простые темы. Попробуйте читать адаптированные книги! 📚',
    'B1 (Средний уровень)': '📙 Вы способны общаться на знакомые темы. Время практиковать разговорный английский! 🗣️',
    'B2 (Выше среднего уровня)': '📕 Вы уверенно используете язык. Поработайте над специализированной лексикой! ✍️',
    'C1 (Продвинутый уровень)': '🌟 Вы владеете языком почти как носитель. Отличное время для совершенствования стиля речи! 🏆',
  };
  return descriptions[level] || '';
}

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const isSubscribed = await checkSubscription(userId);
  if (!isSubscribed) {
    bot.sendMessage(chatId, `Вы должны подписаться на канал ${requiredChannelLink}, чтобы пройти тест.`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Проверить подписку',
              callback_data: `check_subscription_${userId}`
            }
          ]
        ]
      }
    });
    return;
  }

  bot.sendPhoto(chatId, 'image1.jpg', {
    caption: 'Привет! 👋\n\nЭто бот, который определит твой уровень английского языка\n\nГотов? Жми на кнопку ниже',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Пройти тест 🔥',
            callback_data: `start_test_${userId}`,
          },
        ],
      ],
    },
  });
});

bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;

  if (query.data.startsWith('check_subscription_')) {
    const isSubscribed = await checkSubscription(userId);
    if (!isSubscribed) {
      bot.sendMessage(chatId, `Вы все еще не подписаны на канал ${requiredChannelLink}.`);
    } else {
      bot.sendMessage(chatId, 'Спасибо за подписку! Теперь вы можете начать тест.');
      bot.sendPhoto(chatId, 'image1.jpg', {
        caption: 'Привет! 👋\n\nЭто бот, который определит твой уровень английского языка\n\nГотов? Жми на кнопку ниже',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Пройти тест 🔥',
                callback_data: `start_test_${userId}`,
              },
            ],
          ],
        },
      });
    }
    return;
  }

  const isSubscribed = await checkSubscription(userId);
  if (!isSubscribed) {
    bot.sendMessage(chatId, `Вы должны подписаться на канал ${requiredChannelLink}, чтобы продолжить.`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Проверить подписку',
              callback_data: `check_subscription_${userId}`
            }
          ]
        ]
      }
    });
    return;
  }

  if (query.data.startsWith('start_test_')) {
    userSessions[userId] = {
      currentQuestion: 0,
      score: 0,
      timeout: null,
      messageId: null,
      chatId: chatId,
    };
    sendQuestion(chatId, userId);
    return;
  }

  const session = userSessions[userId];
  if (!session) {
    bot.sendMessage(chatId, 'Ваш тест был сброшен из-за неактивности. Наберите /start, чтобы начать заново.');
    return;
  }

  if (query.data.startsWith('resume_')) {
    sendQuestion(chatId, userId);
    resetInactivityTimer(userId);
    return;
  }

  const answerIndex = parseInt(query.data.split('_')[1], 10);
  const questionData = testQuestions[session.currentQuestion];

  if (answerIndex === questionData.correct) {
    session.score++;
  }

  session.currentQuestion++;
  sendQuestion(chatId, userId);
  resetInactivityTimer(userId);
});

// Изменение кода для обработки тайм-аута
function handleInactivity(userId) {
  const session = userSessions[userId];
  if (session) {
    clearTimeout(session.timeout);

    bot.editMessageText(
      'Вы были неактивны. Хотите продолжить тест?',
      {
        chat_id: session.chatId,
        message_id: session.messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Продолжить',
                callback_data: `resume_${userId}`,
              },
            ],
          ],
        },
      }
    );

    session.timeout = null; // Убираем текущий таймер
  }
}

// Изменение существующего таймера
function resetInactivityTimer(userId) {
  const session = userSessions[userId];
  if (session) {
    if (session.timeout) {
      clearTimeout(session.timeout);
    }

    session.timeout = setTimeout(() => handleInactivity(userId), INACTIVITY_TIMEOUT);
  }
}

// Отправка вопроса
function sendQuestion(chatId, userId) {
  const session = userSessions[userId];
  if (!session || session.currentQuestion >= testQuestions.length) {
    if (session) {
      const level = determineLevel(session.score);
      const description = getLevelDescription(level);
      bot.sendMessage(chatId, `Ваш результат: ${session.score}/${testQuestions.length}. Уровень: ${level}\n\n${description}`).then(() => {
        bot.sendAnimation(chatId, 'gif1.gif');
      });
    } else {
      bot.sendMessage(chatId, 'Тест завершён.');
    }
    resetSession(userId);
    return;
  }

  const questionData = testQuestions[session.currentQuestion];
  const options = {
    reply_markup: {
      inline_keyboard: questionData.options.map((option, index) => [{
        text: option,
        callback_data: `answer_${index}`
      }]) // Варианты ответов в столбик
    },
  };

  if (session.messageId) {
    bot.editMessageText(questionData.question, {
      chat_id: chatId,
      message_id: session.messageId,
      ...options,
    });
  } else {
    bot.sendMessage(chatId, questionData.question, options).then((sentMessage) => {
      session.messageId = sentMessage.message_id;
      session.chatId = chatId; // Сохраняем chatId в сессии
    });
  }

  resetInactivityTimer(userId);
}

// Сброс сессии после завершения теста
function resetSession(userId) {
  if (userSessions[userId]) {
    clearTimeout(userSessions[userId].timeout);
    delete userSessions[userId];
  }
}
