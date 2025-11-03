const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for production
// Since we serve static files from the same server, allow all origins
// In production on Render, this will allow connections from your Render URL
const io = new Server(server, { 
  cors: { 
    origin: '*', // Allow all origins (you can restrict this if needed)
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(express.static('client'));

// MongoDB connection with better error handling
const DB_PATH = 'mongodb+srv://mdateeq807_db_user:<mdateeq807_db_user>@cluster0.my6abgj.mongodb.net/?appName=Cluster0';
const mongoUri = process.env.MONGO_URI || DB_PATH;
if (!mongoUri) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

// Optional: Native driver ping to validate credentials before using Mongoose
(async () => {
  // Preflight validation and safe logging
  try {
    const uriStr = String(mongoUri || '');
    if (uriStr.includes('<') || uriStr.includes('>')) {
      console.error('Mongo URI appears to contain placeholders like <...>. Please replace with your actual, URL-encoded password.');
    }
    const schemeIdx = uriStr.indexOf('://');
    const authStart = schemeIdx >= 0 ? schemeIdx + 3 : -1;
    const atIndex = uriStr.indexOf('@', authStart + 1);
    if (authStart > 0 && atIndex > authStart) {
      const authPart = uriStr.slice(authStart, atIndex); // username:password
      const [userPart, passPart = ''] = authPart.split(':');
      const hostAndPath = uriStr.slice(atIndex + 1);
      const host = hostAndPath.split('/')[0];
      const looksUnencoded = /[\s#&/?:%]/.test(passPart);
      console.log(`Mongo URI check → user: ${userPart || '(missing)'} host: ${host || '(missing)'} passwordSet: ${passPart ? 'yes' : 'no'} encodedLikely: ${looksUnencoded ? 'no' : 'yes'}`);
      if (!passPart) {
        console.error('Mongo URI has no password segment after username:. Add your URL-encoded password.');
      } else if (looksUnencoded) {
        console.error('Mongo URI password likely not URL-encoded. Encode it (e.g., @ → %40, # → %23).');
      }
    }
  } catch (_) {}
  try {
    const testClient = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await testClient.connect();
    await testClient.db('admin').command({ ping: 1 });
    console.log('MongoDB ping succeeded. Credentials are valid.');
    await testClient.close();
  } catch (e) {
    console.error('MongoDB ping failed:', e.message);
  }
})();


mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true
})
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    if (err.message.includes('authentication failed')) {
      console.error('\n⚠️  MongoDB Authentication Error:');
      console.error('Please check your MongoDB credentials:');
      console.error('1. Verify your username and password are correct');
      console.error('2. Make sure special characters in password are URL-encoded (e.g., @ becomes %40)');
      console.error('3. Check that your MongoDB Atlas IP whitelist includes your current IP');
      console.error('4. Verify the database user has proper permissions');
    }
    // Don't exit - allow server to start but operations will fail gracefully
  });

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  id: String,
  password: String,
  avatar: String,
  genres: [String],
});
const User = mongoose.model('User', userSchema);

// Helper function to check MongoDB connection
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

const questions = [
  { genre: 'Nature', question: 'What is the largest mammal?', options: ['Blue Whale', 'Elephant', 'Giraffe', 'Lion'], correct: 0, level: 'Easy', hint: 'This animal lives in the ocean and can grow up to 100 feet long.' },
  { genre: 'Sports', question: 'Which country won the 2018 FIFA World Cup?', options: ['France', 'Brazil', 'Germany', 'Argentina'], correct: 0, level: 'Medium', hint: 'This country is located in Western Europe and its capital is Paris.' },
  { genre: 'History', question: 'Who was the first President of the USA?', options: ['George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'], correct: 0, level: 'Easy', hint: 'This founding father led the Continental Army during the American Revolution.' },
  { genre: 'Movies&TV', question: 'Who directed "Inception"?', options: ['Christopher Nolan', 'Steven Spielberg', 'Quentin Tarantino', 'James Cameron'], correct: 0, level: 'Medium', hint: 'This director is also known for the Dark Knight trilogy and Interstellar.' },
  { genre: 'Music', question: 'Who is known as the "King of Pop"?', options: ['Michael Jackson', 'Elvis Presley', 'Prince', 'Justin Bieber'], correct: 0, level: 'Easy', hint: 'This artist released the album "Thriller" in 1982.' },
  { genre: 'Clg Sub', question: 'Which of these is not a primitive data type in Java?', options: ['String', 'int', 'boolean', 'char'], correct: 0, level: 'Easy', hint: 'This data type is a class in Java, not a primitive type.' },
  { genre: 'Clg Sub', question: 'What is the default value of a boolean variable in Java?', options: ['false', 'true', 'null', '0'], correct: 0, level: 'Easy', hint: 'The default value is the opposite of true.' },
  { genre: 'Clg Sub', question: 'Which keyword is used to prevent method overriding in Java?', options: ['final', 'static', 'private', 'protected'], correct: 0, level: 'Medium', hint: 'This keyword can also be used to declare constants.' },
  { genre: 'Clg Sub', question: 'What is the function of the ALU in a computer?', options: ['Performs arithmetic and logical operations', 'Stores data temporarily', 'Controls the flow of data', 'Manages memory'], correct: 0, level: 'Easy', hint: 'ALU stands for Arithmetic Logic Unit.' },
  { genre: 'Clg Sub', question: 'Which register holds the address of the next instruction to be executed?', options: ['Program Counter', 'Instruction Register', 'Memory Address Register', 'Accumulator'], correct: 0, level: 'Medium', hint: 'This register is abbreviated as PC.' },
  { genre: 'Clg Sub', question: 'What is the purpose of cache memory?', options: ['To reduce the average time to access data', 'To store permanent data', 'To increase RAM size', 'To backup data'], correct: 0, level: 'Hard', hint: 'It acts as a buffer between CPU and main memory.' },
  { genre: 'Clg Sub', question: 'What is the output of a NAND gate when both inputs are 1?', options: ['0', '1', 'Undefined', 'High impedance'], correct: 0, level: 'Easy', hint: 'NAND is the complement of AND operation.' },
  { genre: 'Clg Sub', question: 'Which flip-flop is known as a delay flip-flop?', options: ['D Flip-Flop', 'JK Flip-Flop', 'T Flip-Flop', 'SR Flip-Flop'], correct: 0, level: 'Medium', hint: 'The output follows the input with a clock delay.' },
  { genre: 'Clg Sub', question: 'What is the minimum number of NAND gates required to implement an XOR gate?', options: ['4', '2', '3', '1'], correct: 0, level: 'Hard', hint: 'XOR can be implemented using a combination of NAND gates.' },
  { genre: 'Clg Sub', question: 'What is the main purpose of an operating system?', options: ['To manage computer hardware and software resources', 'To create documents', 'To browse the internet', 'To play games'], correct: 0, level: 'Easy', hint: 'It acts as an intermediary between users and hardware.' },
  { genre: 'Clg Sub', question: 'Which scheduling algorithm provides the shortest average waiting time?', options: ['Shortest Job First', 'First Come First Serve', 'Round Robin', 'Priority Scheduling'], correct: 0, level: 'Medium', hint: 'This algorithm selects the process with the smallest execution time first.' },
  { genre: 'Clg Sub', question: 'What is the purpose of virtual memory?', options: ['To extend the apparent size of physical memory', 'To increase CPU speed', 'To improve network performance', 'To enhance graphics processing'], correct: 0, level: 'Hard', hint: 'It allows programs to use more memory than physically available.' },
  { genre: 'Clg Sub', question: 'In Java, what is the difference between == and .equals()?', options: ['== compares references, .equals() compares values', '== compares values, .equals() compares references', 'Both compare values', 'Both compare references'], correct: 0, level: 'Medium', hint: '== is used for primitive types and object references.' },
  { genre: 'Clg Sub', question: 'What is the purpose of the Control Unit in a CPU?', options: ['To direct the operation of the processor', 'To perform arithmetic operations', 'To store data', 'To manage cache memory'], correct: 0, level: 'Medium', hint: 'It is responsible for fetching and decoding instructions.' },
  { genre: 'Clg Sub', question: 'Which of these is a universal gate?', options: ['NAND', 'AND', 'OR', 'NOT'], correct: 0, level: 'Medium', hint: 'This gate can be used to implement any other logic gate.' },
  { genre: 'Clg Sub', question: 'What is the purpose of the page table in virtual memory?', options: ['To map virtual addresses to physical addresses', 'To store program instructions', 'To manage cache memory', 'To handle interrupts'], correct: 0, level: 'Hard', hint: 'It helps in address translation.' },
  { genre: 'Clg Sub', question: 'What is method overloading in Java?', options: ['Multiple methods with same name but different parameters', 'Multiple methods with same name and parameters', 'A method that calls itself', 'A method that cannot be overridden'], correct: 0, level: 'Medium', hint: 'It is a compile-time polymorphism.' },
  { genre: 'Clg Sub', question: 'What is the purpose of the MAR (Memory Address Register)?', options: ['To hold the address of the memory location to be accessed', 'To store data temporarily', 'To perform arithmetic operations', 'To manage cache memory'], correct: 0, level: 'Medium', hint: 'It is used in the fetch-decode-execute cycle.' },
  { genre: 'Clg Sub', question: 'What is the truth table output for a NOR gate with inputs A=1, B=0?', options: ['0', '1', 'Undefined', 'High impedance'], correct: 0, level: 'Easy', hint: 'NOR is the complement of OR operation.' },
  { genre: 'Clg Sub', question: 'What is the purpose of the TLB (Translation Lookaside Buffer)?', options: ['To speed up virtual address translation', 'To store program instructions', 'To manage cache memory', 'To handle interrupts'], correct: 0, level: 'Hard', hint: 'It is a special cache for page table entries.' },
  { genre: 'Clg Sub', question: 'What is the difference between ArrayList and LinkedList in Java?', options: ['ArrayList uses dynamic array, LinkedList uses doubly linked list', 'ArrayList uses linked list, LinkedList uses array', 'Both use arrays', 'Both use linked lists'], correct: 0, level: 'Medium', hint: 'Consider their performance for different operations.' },
  { genre: 'Clg Sub', question: 'What is the purpose of the instruction pipeline in a processor?', options: ['To improve instruction throughput', 'To increase clock speed', 'To reduce memory access time', 'To manage cache memory'], correct: 0, level: 'Hard', hint: 'It allows multiple instructions to be processed simultaneously.' },
  { genre: 'Clg Sub', question: 'What is the output of a half adder when both inputs are 1?', options: ['Sum=0, Carry=1', 'Sum=1, Carry=0', 'Sum=1, Carry=1', 'Sum=0, Carry=0'], correct: 0, level: 'Medium', hint: 'Consider binary addition of 1+1.' },
  { genre: 'Clg Sub', question: 'What is the purpose of the interrupt vector table?', options: ['To store addresses of interrupt service routines', 'To manage virtual memory', 'To store program instructions', 'To handle cache misses'], correct: 0, level: 'Hard', hint: 'It helps the processor respond to interrupts quickly.' },
];

let rooms = [];
let usedQuestions = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('login', async ({ id, password }) => {
    if (!isMongoConnected()) {
      socket.emit('auth-error', { message: 'Database connection failed. Please try again later.' });
      return;
    }
    try {
      const user = await User.findOne({ id, password });
      if (user) {
        const userData = {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          name: `${user.firstname} ${user.lastname}`,
          avatar: user.avatar || '',
          genres: user.genres || [],
          isGuest: false
        };
        socket.user = userData;
        socket.emit('auth-success', { user: userData, isGuest: false, skipAvatar: true });
      } else {
        socket.emit('auth-error', { message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      socket.emit('auth-error', { message: 'Database error. Please try again later.' });
    }
  });

  socket.on('signup', async ({ firstname, lastname, id, password }) => {
    if (!isMongoConnected()) {
      socket.emit('auth-error', { message: 'Database connection failed. Please try again later.' });
      return;
    }
    try {
      const existingUser = await User.findOne({ id });
      if (existingUser) {
        socket.emit('auth-error', { message: 'User already exists' });
      } else {
        const user = new User({ firstname, lastname, id, password, avatar: '', genres: [] });
        await user.save();
        const userData = {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          name: `${user.firstname} ${user.lastname}`,
          avatar: user.avatar,
          genres: user.genres,
          isGuest: false
        };
        socket.user = userData;
        socket.emit('auth-success', { user: userData, isGuest: false, skipAvatar: false });
      }
    } catch (error) {
      console.error('Signup error:', error);
      socket.emit('auth-error', { message: 'Database error. Please try again later.' });
    }
  });

  socket.on('guest', ({ name }) => {
    const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: guestId,
      name: name,
      avatar: '',
      genres: [],
      isGuest: true
    };
    socket.user = user;
    socket.emit('auth-success', { user, isGuest: true });
  });

  socket.on('update-user', async (userData) => {
    if (!socket.user.isGuest) {
      if (!isMongoConnected()) {
        console.warn('Cannot update user: MongoDB not connected');
        return;
      }
      try {
        await User.updateOne(
          { id: socket.user.id },
          { 
            avatar: userData.avatar,
            genres: userData.genres,
            firstname: userData.firstname,
            lastname: userData.lastname
          }
        );
        socket.user = {
          ...socket.user,
          avatar: userData.avatar,
          genres: userData.genres,
          name: `${userData.firstname} ${userData.lastname}`
        };
      } catch (error) {
        console.error('Update user error:', error);
      }
    } else {
      socket.user = {
        ...socket.user,
        avatar: userData.avatar,
        genres: userData.genres
      };
    }
  });

  socket.on('create-room', ({ name, genres, level }) => {
    const room = { id: Math.random().toString(36).substr(2, 9), name, genres, level, players: [{ id: socket.id, user: socket.user, hintsLeft: 3, costHints: 0 }], host: socket.id };
    rooms.push(room);
    console.log('Room created:', room);
    socket.join(room.id);
    socket.emit('room-joined', room);
    io.emit('room-list', rooms);
  });

  socket.on('get-rooms', () => {
    socket.emit('room-list', rooms.filter(room => room.players.length < 5));
  });

  socket.on('join-room', (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.players.length < 5) {
      room.players.push({ id: socket.id, user: socket.user, hintsLeft: 3, costHints: 0 });
      socket.join(room.id);
      console.log('Player', socket.id, 'joined room:', room.id);
      io.to(room.id).emit('room-joined', room); // Emit to all players in room
      io.emit('room-list', rooms);
    } else {
      socket.emit('auth-error', { message: 'Room full or not found' });
    }
  });

  socket.on('start-room', (roomId) => {
    console.log('Received start-room event for room ID:', roomId);
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      console.log('Room not found for ID:', roomId);
      socket.emit('auth-error', { message: 'Room not found' });
      return;
    }
    if (room.host !== socket.id) {
      console.log('User is not the host. Socket ID:', socket.id, 'Host ID:', room.host);
      socket.emit('auth-error', { message: 'Only the host can start the game' });
      return;
    }
    if (room.players.length >= 1) {
      console.log('Starting quiz for room:', roomId, 'Players:', room.players.length);
      startQuiz(room, true);
    } else {
      console.log('Not enough players. Players count:', room.players.length);
      socket.emit('auth-error', { message: 'At least 1 player required to start (testing mode)' });
    }
  });

  socket.on('start-normal', ({ level, genres }) => {
    console.log('Starting normal game for socket:', socket.id, 'Level:', level, 'Genres:', genres);
    const room = { id: socket.id, genres: genres.length ? genres : ['Mixed'], level, players: [{ id: socket.id, user: socket.user, hintsLeft: 2, costHints: 0 }], host: socket.id };
    rooms.push(room); // Add to rooms for consistency
    socket.join(room.id);
    startQuiz(room, false);
  });

  socket.on('start-custom', ({ genres, level, puzzle }) => {
    console.log('Starting custom game for socket:', socket.id, 'Genres:', genres, 'Level:', level, 'Puzzle:', puzzle);
    const room = { id: socket.id, genres, level, players: [{ id: socket.id, user: socket.user, hintsLeft: 2, costHints: 0 }], host: socket.id, puzzle };
    rooms.push(room); // Add to rooms for consistency
    socket.join(room.id);
    startQuiz(room, false);
  });

  socket.on('answer', ({ answer, roomId, questionId }) => {
    console.log('Received answer:', answer, 'from socket:', socket.id, 'for room:', roomId);
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.players.find(p => p.id === socket.id)) {
      console.log('Invalid room or player. Room ID:', roomId, 'Socket ID:', socket.id);
      return;
    }
    const used = usedQuestions.get(room.id) || [];
    const currentQuestion = questions.find(q => q.question === used[questionId]);
    if (!currentQuestion) {
      console.log('No current question found. Used questions:', used, 'Index:', questionId);
      return;
    }
    const correct = answer === currentQuestion.correct;
    console.log('Answer correct:', correct, 'Selected:', answer, 'Correct:', currentQuestion.correct);
    
    // Initialize scores if not exists
    if (!room.scores) {
      room.scores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
    }
    
    if (correct) {
      if (!room.answered) {
        // First correct answer gets 3 points
        room.scores[socket.id] = (room.scores[socket.id] || 0) + 3;
        room.answered = socket.id;
        console.log('First correct answer by:', socket.id, 'Score:', room.scores[socket.id]);
      } else {
        // Subsequent correct answers get 1 point
        room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
        console.log('Subsequent correct answer by:', socket.id, 'Score:', room.scores[socket.id]);
      }
      
      // Check if any player has reached 15 points
      const winner = Object.entries(room.scores).find(([_, score]) => score >= 15);
      if (winner) {
        const [winnerId, winnerScore] = winner;
        const winnerPlayer = room.players.find(p => p.id === winnerId);
        endQuiz(room, room.scores, { winner: winnerPlayer, score: winnerScore });
        return;
      }
    }
    
    // Mark this player as having answered
    if (!room.answeredPlayers) {
      room.answeredPlayers = new Set();
    }
    room.answeredPlayers.add(socket.id);
    
    socket.emit('answer-result', { questionId, correct, answer, correctAnswer: currentQuestion.correct });
    io.to(room.id).emit('scores', Object.entries(room.scores).map(([id, score]) => [room.players.find(p => p.id === id).user.name, score]));
    
    // Check if all players have answered
    if (room.answeredPlayers.size === room.players.length) {
      // Clear answered players for next question
      room.answeredPlayers.clear();
      // Move to next question immediately
      if (room.sendQuestion) {
        room.sendQuestion();
      }
    }
  });

  function startQuiz(room, isMultiplayer) {
    console.log('startQuiz called for room:', room.id, 'Multiplayer:', isMultiplayer, 'Genres:', room.genres, 'Level:', room.level);
    usedQuestions.set(room.id, []); // Reset used questions
    let timePerQuestion = { Easy: 10, Medium: 15, Hard: 20 }[room.level] || 15;
    console.log('Emitting quiz-start to room:', room.id);
    io.to(room.id).emit('quiz-start', { isMultiplayer, timePerQuestion, puzzle: room.puzzle || false });
    let questionIndex = 0;
    room.scores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
    room.answered = null;

    room.sendQuestion = function() {
      console.log('sendQuestion called for room:', room.id, 'Question index:', questionIndex);
      if (questionIndex >= 12) {
        console.log('Quiz ended: Reached 12 questions');
        endQuiz(room, room.scores);
        return;
      }

      // Reset answered flag for new question
      room.answered = null;

      let availableQuestions = room.genres.includes('Mixed') ? questions : questions.filter(q => room.genres.includes(q.genre));
      console.log('Initial available questions (after genre filter):', availableQuestions.length, 'Genres:', room.genres);
      availableQuestions = availableQuestions.filter(q => q.level === room.level);
      console.log('After level filter:', availableQuestions.length, 'Level:', room.level);
      const used = usedQuestions.get(room.id) || [];
      availableQuestions = availableQuestions.filter(q => !used.includes(q.question));
      console.log('After used filter:', availableQuestions.length, 'Used questions:', used);

      if (availableQuestions.length === 0) {
        console.log('No questions for selected level, falling back to any level');
        availableQuestions = room.genres.includes('Mixed') ? questions : questions.filter(q => room.genres.includes(q.genre));
        console.log('After level fallback:', availableQuestions.length);
      }

      if (availableQuestions.length === 0) {
        console.log('No questions for selected genres, resetting used questions');
        usedQuestions.set(room.id, []);
        availableQuestions = room.genres.includes('Mixed') ? questions : questions.filter(q => room.genres.includes(q.genre));
        availableQuestions = availableQuestions.filter(q => q.level === room.level);
        console.log('After reset and level filter:', availableQuestions.length);
      }

      if (availableQuestions.length === 0) {
        console.log('Still no questions, falling back to all questions');
        availableQuestions = questions;
        console.log('After full fallback:', availableQuestions.length);
      }

      if (availableQuestions.length === 0) {
        console.log('No questions available at all');
        io.to(room.id).emit('auth-error', { message: 'No questions available for selected criteria.' });
        endQuiz(room, room.scores);
        return;
      }

      const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      used.push(question.question);
      usedQuestions.set(room.id, used);
      console.log('Emitting question:', question.question, 'to room:', room.id);
      io.to(room.id).emit('question', { questionId: questionIndex, question: question.question, options: question.options, time: timePerQuestion });
      setTimeout(() => {
        console.log('Timeout triggered for next question, index:', questionIndex);
        room.sendQuestion();
      }, timePerQuestion * 1000 + 1000);
      questionIndex++;
    };

    // Start the first question
    room.sendQuestion();

    socket.on('use-hint', ({ roomId, questionId }) => {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      const used = usedQuestions.get(room.id) || [];
      const currentQuestion = questions.find(q => q.question === used[questionIndex - 1]);
      if (!currentQuestion) return;
      if (isMultiplayer) {
        if (player.hintsLeft > 0) {
          player.hintsLeft--;
          socket.emit('hint-result', { success: true, hintsLeft: player.hintsLeft, hint: currentQuestion.hint, questionId });
        } else {
          socket.emit('hint-result', { success: false, message: 'No hints left', questionId });
        }
      } else {
        if (player.hintsLeft > 0) {
          player.hintsLeft--;
          socket.emit('hint-result', { success: true, hintsLeft: player.hintsLeft, hint: currentQuestion.hint, questionId });
        } else if (player.costHints < { Easy: 2, Medium: 3, Hard: 3 }[room.level]) {
          const cost = player.costHints === 0 ? 2 : player.costHints === 1 ? 3 : 6;
          socket.emit('hint-result', { cost, message: `Using this hint will reduce time by ${cost} seconds`, questionId });
        } else {
          socket.emit('hint-result', { success: false, message: 'No hints left', questionId });
        }
      }
    });

    socket.on('use-cost-hint', ({ roomId, questionId }) => {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      const used = usedQuestions.get(room.id) || [];
      const currentQuestion = questions.find(q => q.question === used[questionIndex - 1]);
      if (!currentQuestion) return;
      player.costHints = (player.costHints || 0) + 1;
      const cost = player.costHints === 1 ? 2 : player.costHints === 2 ? 3 : 6;
      timePerQuestion = Math.max(5, timePerQuestion - cost);
      socket.emit('hint-result', { success: true, hintsLeft: player.hintsLeft, timePerQuestion, hint: currentQuestion.hint, questionId });
    });
  }

  function endQuiz(room, scores, winnerData) {
    // Check if results have already been sent for this room
    if (room.resultsSent) {
      console.log('Results already sent for room:', room.id);
      return;
    }

    console.log('Ending quiz for room:', room.id, 'Scores:', scores);
    if (room.players.length > 1) {
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      
      // Get player names from room.players
      const getPlayerName = (playerId) => {
        const player = room.players.find(p => p.id === playerId);
        return player?.user?.name || 'Unknown Player';
      };

      const winner = winnerData || { 
        name: getPlayerName(sorted[0][0]),
        score: sorted[0][1] 
      };
      
      const runner = sorted[1] ? { 
        name: getPlayerName(sorted[1][0]),
        score: sorted[1][1] 
      } : null;
      
      const others = sorted.slice(2).map(([id, score]) => ({
        name: getPlayerName(id),
        score
      }));

      console.log('Sending results:', { winner, runner, others });
      io.to(room.id).emit('results', { winner, runner, others });
      rooms = rooms.filter(r => r.id !== room.id);
    } else {
      const player = room.players[0];
      const playerName = player?.user?.name || 'You';
      console.log('Sending single player results:', { name: playerName, score: scores[player.id] });
      io.to(room.id).emit('results', { 
        name: playerName,
        score: scores[player.id]
      });
      rooms = rooms.filter(r => r.id !== room.id);
    }
    
    // Mark that results have been sent for this room
    room.resultsSent = true;
    usedQuestions.delete(room.id);
  }

  socket.on('leave-room', () => {
    const room = rooms.find(r => r.players.some(p => p.id === socket.id));
    if (room) {
      const leavingPlayer = room.players.find(p => p.id === socket.id);
      if (leavingPlayer) {
        io.to(room.id).emit('player-left', { playerName: leavingPlayer.user.name });
      }
    }
    rooms = rooms.map(room => ({
      ...room,
      players: room.players.filter(p => p.id !== socket.id),
    }));
    rooms = rooms.filter(room => room.players.length > 0);
    io.emit('room-list', rooms);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    rooms = rooms.map(room => ({
      ...room,
      players: room.players.filter(p => p.id !== socket.id),
    }));
    rooms = rooms.filter(room => room.players.length > 0);
    io.emit('room-list', rooms);
  });
});

const PORT = process.env.PORT || 3005;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Local: http://localhost:${PORT}/`);
  }
});