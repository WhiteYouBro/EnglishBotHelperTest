const TelegramBot = require('node-telegram-bot-api');
const token = '8125764878:AAHKwqCtYKeYcXDoG8x09mapynEq-m_WxF8'; // токен бота
const bot = new TelegramBot(token, { polling: true });

const requiredChannel = '-1001857511663'; // заменить на id канала который нужно чтоб человек был подписан
const requiredChannelLink = "https://t.me/AmericaninSPB"; // а здесь просто ссылка на канал
const testQuestions = [
  {
    question: 'What is the capital of England?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correct: 1
  },
  {
    question: 'Choose the correct sentence:',
    options: ['She go to school.', 'She goes to school.', 'She going to school.', 'She gone to school.'],
    correct: 1
  },
  {
    question: 'What is the opposite of "hot"?',
    options: ['Cold', 'Warm', 'Cool', 'Freezing'],
    correct: 0
  },
  {
    question: 'Which word is a noun?',
    options: ['Quickly', 'Happy', 'Dog', 'Run'],
    correct: 2
  },
  {
    question: 'I ___ breakfast every day.',
    options: ['eat', 'eats', 'eating', 'eaten'],
    correct: 0
  },
  {
    question: 'Where ___ you live?',
    options: ['does', 'do', 'are', 'is'],
    correct: 1
  },
  {
    question: 'Choose the correct preposition: The cat is ___ the table.',
    options: ['on', 'in', 'at', 'over'],
    correct: 0
  },
  {
    question: 'What is the past tense of "go"?',
    options: ['Goed', 'Went', 'Gone', 'Going'],
    correct: 1
  },
  {
    question: 'If I ___ you, I would study harder.',
    options: ['was', 'am', 'were', 'be'],
    correct: 2
  },
  {
    question: 'Choose the correct form: She has ___ her homework yet.',
    options: ['finish', 'finished', 'finishing', 'finishes'],
    correct: 1
  },
  {
    question: 'What does "to break the ice" mean?',
    options: ['To make something cold', 'To start a conversation in a social setting', 'To break something physically', 'To end a relationship'],
    correct: 1
  },
  {
    question: 'Which sentence is correct?',
    options: ['He don’t like coffee.', 'He doesn’t likes coffee.', 'He doesn’t like coffee.', 'He not like coffee.'],
    correct: 2
  },
  {
    question: 'Although it was raining, we decided to go for a walk. This sentence shows:',
    options: ['Cause and effect', 'Contrast', 'Addition', 'Comparison'],
    correct: 1
  },
  {
    question: 'Choose the best synonym for "happy":',
    options: ['Sad', 'Joyful', 'Angry', 'Tired'],
    correct: 1
  },
  {
    question: 'What is the meaning of "to hit the books"?',
    options: ['To exercise', 'To study hard', 'To write a book', 'To read casually'],
    correct: 1
  },
  {
    question: 'Which sentence uses the passive voice correctly?',
    options: ['The cake was eaten by John.', 'John eats the cake.', 'John was eat the cake.', 'The cake eaten by John was.'],
    correct: 0
  },
  {
    question: 'Choose the correct word to complete the sentence: The committee reached a ___ decision after much debate.',
    options: ['consensus', 'contradicting', 'controversial', 'conclusive'],
    correct: 0
  },
  {
    question: 'The phrase "in light of" means:',
    options: ['Because of', 'In spite of', 'During', 'After'],
    correct: 0
  },
  {
    question: 'Which sentence is grammatically correct?',
    options: ['If I had known about the meeting, I would have attended it.', 'If I know about the meeting, I would attend it.', 'If I knew about the meeting, I will attend it.', 'If I had know about the meeting, I would attend it.'],
    correct: 0
  },
  {
    question: 'What does "to throw in the towel" mean?',
    options: ['To give up or admit defeat', 'To start something new', 'To take a break', 'To celebrate success'],
    correct: 0
  }
];

const userSessions = {}; //  состояния пользователей
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 час для неактивности (после идёт сброс) для 1 минуты неактивности надо 10 ввести

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
  if (score <= 4) return 'A1 (Начальный уровень)';
  if (score <= 8) return 'A2 (Элементарный уровень)';
  if (score <= 12) return 'B1 (Средний уровень)';
  if (score <= 16) return 'B2 (Выше среднего уровня)';
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

bot.on('polling_error', (error) => {
	var time = new Date();
	console.log("TIME:", time);
	console.log("CODE:", error.code);  // => 'EFATAL'
	console.log("MSG:", error.message);
	console.log("STACK:", error.stack);
});

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

  bot.sendMessage(chatId, 'Вы хотите узнать свой уровень английского?', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Хочу узнать',
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
      bot.sendMessage(chatId, 'Вы хотите узнать свой уровень английского?', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Хочу узнать',
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
      bot.sendMessage(chatId, `Ваш результат: ${session.score}/${testQuestions.length}. Уровень: ${level}\n\n${description}`);
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
