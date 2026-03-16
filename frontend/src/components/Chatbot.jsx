import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Sparkles, Mic, Trash2, MessageCircle, BookOpen, Code, Calculator, Globe, Lightbulb, Volume2 } from 'lucide-react';
import './Chatbot.css';

const quickActions = [
    { icon: BookOpen, label: 'Explain Topic', prompt: 'Explain' },
    { icon: Code, label: 'Write Code', prompt: 'Write a code for' },
    { icon: Calculator, label: 'Solve Math', prompt: 'Solve this math problem:' },
    { icon: Lightbulb, label: 'Give Tips', prompt: 'Give me study tips for' },
    { icon: Globe, label: 'General Knowledge', prompt: 'What is' },
];

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm your AI Learning Assistant 🎓\n\nI can help you with:\n• 📚 Understanding any topic\n• 💻 Coding problems\n• 📐 Math & Science\n• 📝 Exam preparation\n• 💡 Study tips\n\nWhat would you like to learn today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (userMessage = input) => {
        if (!userMessage.trim() || loading) return;

        const msg = userMessage.trim();
        setInput('');
        setShowSuggestions(false);
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);

        let apiSuccess = false;
        let botResponse = '';

        try {
            const model = 'google/flan-t5-large';

            const response = await fetch(
                `https://api-inference.huggingface.co/models/${model}`,
                {
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body: JSON.stringify({
                        inputs: `Answer this question helpfully: ${msg}`,
                        parameters: {
                            max_new_tokens: 300,
                            temperature: 0.8,
                        }
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0].generated_text) {
                    botResponse = data[0].generated_text.trim();
                    if (botResponse && botResponse.length > 10 && botResponse !== msg) {
                        apiSuccess = true;
                    }
                }
            }
        } catch (error) {
            console.log('API error:', error.message);
        }

        if (!apiSuccess || !botResponse) {
            try {
                const response = await fetch(
                    'https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
                    {
                        headers: {
                            'Authorization': `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        method: 'POST',
                        body: JSON.stringify({
                            inputs: `<|system|>\nYou are a helpful tutor. Answer clearly.</s>\n<|user|>\n${msg}</s>\n<|assistant|>\n`,
                            parameters: {
                                max_new_tokens: 250,
                                temperature: 0.8,
                            }
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data && data[0] && data[0].generated_text) {
                        const raw = data[0].generated_text;
                        const parts = raw.split('<|assistant|>');
                        botResponse = parts[parts.length - 1].trim();
                        if (botResponse && botResponse.length > 15) {
                            apiSuccess = true;
                        }
                    }
                }
            } catch (e) {
                console.log('TinyLlama failed:', e.message);
            }
        }

        if (apiSuccess && botResponse) {
            setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
        } else {
            const smartResponse = getSmartResponse(msg);
            setMessages(prev => [...prev, { role: 'assistant', content: smartResponse }]);
        }

        setLoading(false);
    };

    const getSmartResponse = (question) => {
        const q = question.toLowerCase();

        // Basic programming concepts
        if (q.includes('variable') || q.includes('veriable')) {
            return "📦 **Variables** are containers for storing data!\n\n**Think of it like:**\n• A labeled box\n• Has a name and holds a value\n\n**Examples:**\n```python\nname = \"John\"      # String\nage = 25           # Integer\nprice = 19.99      # Float\nis_student = True  # Boolean\n```\n\n**Key points:**\n• Choose descriptive names\n• Different types for different data\n• Can be changed (mutable)\n\nWant to learn more?";
        }

        if (q.includes('function') || q.includes('method')) {
            return "⚡ **Functions** are reusable blocks of code!\n\n**Why use them:**\n• Avoid repetition\n• Organize code\n• Make it reusable\n\n**Example:**\n```python\ndef greet(name):\n    return f\"Hello, {name}!\"\n\nmessage = greet(\"John\")\nprint(message)  # Hello, John!\n```\n\n**Parts:**\n• def (keyword)\n• name (identifier)\n• parameters (inputs)\n• return (output)\n\nWant a specific language example?";
        }

        // Math problem solver
        if (q.includes('math') || q.includes('problem') || q.includes('solve') || q.includes('calculate') || q.match(/\d+[\s+\-*/=]+\d+/)) {
            return "🧮 **Let's solve this!**\n\nI can help with:\n• Arithmetic (+ - × ÷)\n• Algebra (equations)\n• Geometry formulas\n• Word problems\n\n**Tip:** For best results:\n1. Identify what's given\n2. Identify what's asked\n3. Choose the right formula\n4. Solve step by step\n\nCan you share the specific problem?";
        }

        if (q.includes('algebra') || q.includes('equation')) {
            return "📐 **Algebra** - Solve for unknowns!\n\n**Basic equation:**\n```\nx + 5 = 10\nx = 10 - 5\nx = 5\n```\n\n**Steps:**\n1. Get variables on one side\n2. Get numbers on other side\n3. Divide/multiply to solve\n\n**Example:**\n```\n2x + 3 = 11\n2x = 11 - 3\n2x = 8\nx = 4\n```\n\nNeed help with a specific problem?";
        }

        // Greetings
        if (q.match(/hello|hi|hey|good morning|good evening|greetings/)) {
            return "Hello! Great to see you! 🌟\n\nHow can I help you learn today? You can ask me about:\n• Any subject or topic\n• Coding problems\n• Math solutions\n• Study strategies";
        }

        // Programming
        if (q.includes('python')) {
            return "🐍 **Python** is a versatile, beginner-friendly language!\n\n**Key Features:**\n• Easy syntax, like English\n• Used in AI, Web Dev, Data Science\n• Huge community support\n\n**Start with:**\n1. Variables & Data Types\n2. Lists & Dictionaries\n3. Functions & Loops\n4. Simple projects\n\nWant me to write some Python code for you?";
        }

        if (q.includes('javascript') || q.includes(' js ')) {
            return "📜 **JavaScript** powers the web!\n\n**What it does:**\n• Interactive websites\n• Web & Mobile apps\n• Server-side (Node.js)\n• Games\n\n**Learn order:**\n1. Variables & DOM\n2. Events\n3. ES6+ features\n4. React/Vue/Angular\n\nWould you like a code example?";
        }

        if (q.includes('java')) {
            return "☕ **Java** - Write Once, Run Anywhere!\n\n**Used for:**\n• Android apps\n• Enterprise software\n• Web applications\n\n**Basics to learn:**\n1. OOP concepts\n2. Classes & Objects\n3. Inheritance\n4. Exception handling\n\nNeed help with Java code?";
        }

        if (q.includes('c++') || q.includes('cpp')) {
            return "⚡ **C++** - The powerful language!\n\n**Best for:**\n• Game development\n• System programming\n• High-performance apps\n• Competitions\n\n**Core concepts:**\n• Pointers & Memory\n• Classes & OOP\n• STL library\n• Performance optimization";
        }

        if (q.includes('code') || q.includes('programming') || q.includes('coding')) {
            return "💻 **Let's learn programming!**\n\n**For beginners, I recommend:**\n1. **Python** - Easiest syntax\n2. **JavaScript** - Web development\n3. **Java** - Android apps\n\n**How to start:**\n• Pick a language\n• Learn basics (variables, loops, functions)\n• Practice daily\n• Build small projects\n\nWhich language interests you?";
        }

        // Data Science & AI
        if (q.includes('machine learning') || q.includes('ml ') || q.includes(' ai ') || q.includes('artificial intelligence')) {
            return "🤖 **AI & Machine Learning** - Future Technology!\n\n**Roadmap:**\n1. **Python** - Programming\n2. **Math** - Linear Algebra, Stats, Calc\n3. **ML Libraries** - Scikit-learn, TensorFlow\n4. **Projects** - Build portfolio\n\n**Popular Applications:**\n• Image recognition\n• NLP (Chatbots)\n• Recommendation systems\n• Self-driving cars\n\nWant to learn a specific ML concept?";
        }

        if (q.includes('data science')) {
            return "📊 **Data Science** - Turn data into insights!\n\n**Skills needed:**\n• Python/R\n• Statistics\n• Pandas & NumPy\n• Visualization (Matplotlib)\n• Machine Learning\n\n**Career paths:**\n• Data Analyst\n• Data Scientist\n• ML Engineer\n\nWhat aspect interests you most?";
        }

        // Math
        if (q.includes('math') || q.includes('algebra') || q.includes('calculus')) {
            return "📐 **Math** is the foundation of everything!\n\n**Study tips:**\n1. Understand concepts, don't memorize\n2. Practice with problems daily\n3. Visualize concepts\n4. Connect to real examples\n\n**Resources:**\n• Khan Academy\n• 3Blue1Brown (videos)\n• Practice problems\n\nWhat math topic do you need help with?";
        }

        // Web Dev
        if (q.includes('web') || q.includes('html') || q.includes('css')) {
            return "🌐 **Web Development** - Build for the internet!\n\n**Tech Stack:**\n• **HTML** - Structure\n• **CSS** - Styling\n• **JavaScript** - Interactivity\n• **React/Vue** - Frameworks\n\n**Start path:**\n1. Learn HTML basics\n2. Style with CSS\n3. Add JS interactivity\n4. Learn a framework\n\nWant to build something specific?";
        }

        // Database
        if (q.includes('database') || q.includes('sql') || q.includes('mysql')) {
            return "🗄️ **Databases** store information!\n\n**Types:**\n• **SQL** - Structured (MySQL, PostgreSQL)\n• **NoSQL** - Flexible (MongoDB)\n\n**Key concepts:**\n• Tables & Relations\n• Queries (SELECT, INSERT)\n• Indexing\n• Joins\n\n**Learn SQL:**\n• SELECT & WHERE\n• JOIN multiple tables\n• Aggregate functions\n\nNeed help with a query?";
        }

        // Study tips
        if (q.includes('study') || q.includes('learn') || q.includes('exam')) {
            return "📝 **Effective Study Tips!**\n\n**Best practices:**\n1. Set clear goals\n2. Pomodoro technique (25min breaks)\n3. Active recall\n4. Spaced repetition\n5. Sleep well\n\n**During study:**\n* Eliminate distractions\n* Take notes by hand\n* Teach someone\n\n**Before exam:**\n* Past papers\n* Quick revisions\n* Stay calm\n\nWant specific tips for a subject?";
        }

        // Career
        if (q.includes('career') || q.includes('job') || q.includes('future')) {
            return "🚀 **Tech Career Paths!**\n\n**Popular roles:**\n• Frontend Developer\n• Backend Developer\n• Full Stack\n• Data Scientist\n• DevOps Engineer\n• AI/ML Engineer\n\n**How to start:**\n1. Learn programming\n2. Build projects\n3. Create portfolio\n4. Contribute to open source\n5. Network\n\n**Certifications:**\n• AWS, Google Cloud\n• Meta, IBM\n\nWhat field interests you?";
        }

        // React
        if (q.includes('react')) {
            return "⚛️ **React** - Most popular UI library!\n\n**Core concepts:**\n• Components\n• Props & State\n• useState, useEffect\n• Hooks\n\n**To learn React:**\n1. Know JavaScript well\n2. Learn JSX\n3. Component structure\n4. State management\n5. Build projects\n\n**Popular add-ons:**\n• Redux, React Router\n• Next.js\n\nWant a React code example?";
        }

        // Help
        if (q.includes('help')) {
            return "🙋 **I'm here to help!**<br/><br/>Ask me about:<br/>• 📚 Any subject<br/>• 💻 Coding problems<br/>• 📐 Math solutions<br/>• 💡 Study tips<br/>• 🎯 Career guidance<br/><br/>Just type your question!";
        }

        // Thank you
        if (q.includes('thank')) {
            return "😊 You're welcome!<br/><br/>Keep learning and growing! 🌟<br/>Feel free to ask more questions anytime!";
        }

        // Default smart response
        // Extract keywords and give contextual response
        const keywords = {
            'react': "React is a popular JavaScript library for building user interfaces. It uses components, state, and props to create dynamic web apps.",
            'node': "Node.js is a JavaScript runtime that lets you run JavaScript on the server. It's great for building fast, scalable backends.",
            'html': "HTML (HyperText Markup Language) is the standard language for creating web pages. It defines the structure of a webpage.",
            'css': "CSS (Cascading Style Sheets) is used to style and layout web pages. It controls colors, fonts, spacing, and more.",
            'sql': "SQL (Structured Query Language) is used to manage and manipulate databases. Key commands include SELECT, INSERT, UPDATE, DELETE.",
            'api': "API (Application Programming Interface) allows different software applications to communicate. REST APIs are common for web services.",
            'git': "Git is a version control system that tracks changes in your code. Key commands: git init, add, commit, push, pull, merge.",
            'algorithm': "Algorithms are step-by-step procedures for solving problems. Important ones include sorting, searching, and graph algorithms.",
            'loop': "Loops repeat code execution. Common types: for loops, while loops, and forEach methods.",
            'array': "Arrays store multiple values in a single variable. They use zero-based indexing and have methods like push, pop, map, filter.",
            'object': "Objects store data as key-value pairs in JavaScript. They're used to represent real-world entities.",
            'class': "Classes are blueprints for creating objects in object-oriented programming. They define properties and methods.",
            'database': "Databases store and organize data. SQL databases use tables with rows and columns; NoSQL databases are more flexible.",
            'web': "Web development involves creating websites and web applications using HTML, CSS, JavaScript, and various frameworks.",
            'ai': "Artificial Intelligence enables machines to learn and make decisions. Key areas: Machine Learning, Deep Learning, NLP.",
            'machine learning': "Machine Learning is a type of AI that learns from data. Types: Supervised, Unsupervised, Reinforcement Learning.",
            'data': "Data science involves collecting, analyzing, and interpreting data. Key skills: Python, Statistics, Machine Learning.",
            'cloud': "Cloud computing provides computing services over the internet. Major providers: AWS, Azure, Google Cloud.",
            'security': "Cybersecurity protects systems from attacks. Key concepts: encryption, authentication, firewalls, secure coding.",
            'test': "Testing ensures code works correctly. Types: Unit tests, Integration tests, End-to-end tests.",
        };

        for (const [key, value] of Object.entries(keywords)) {
            if (q.includes(key)) {
                return value + "\n\nWould you like me to explain this in more detail or provide examples?";
            }
        }

        return `I'd be happy to help you with "${question}"!\n\nAs an AI tutor, I can explain:\n• Programming concepts & code\n• Math & science problems\n• Study strategies\n• Career guidance\n\nCould you try rephrasing your question? For example:\n• "What is a variable in programming?"\n• "How does a function work?"\n• "Explain machine learning"`;
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleQuickAction = (prompt) => {
        const customPrompts = {
            'Explain': 'Explain what is a variable in programming',
            'Write a code for': 'Write a code for a simple calculator',
            'Solve this math problem:': 'Solve this math problem: 2x + 5 = 15',
            'Give me study tips for': 'Give me study tips for learning programming',
            'What is': 'What is artificial intelligence',
        };
        sendMessage(customPrompts[prompt] || prompt);
    };

    const clearChat = () => {
        setMessages([
            { role: 'assistant', content: "Chat cleared! 🔄\n\nHow can I help you learn today?" }
        ]);
        setShowSuggestions(true);
    };

    if (!isOpen) {
        return (
            <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                <Sparkles size={24} />
            </button>
        );
    }

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <div className="chatbot-title">
                    <Sparkles className="sparkle-icon" size={20} />
                    <span>AI Learning Assistant</span>
                </div>
                <div className="header-actions">
                    <button className="header-btn" onClick={clearChat} title="Clear Chat">
                        <Trash2 size={18} />
                    </button>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </button>
                </div>
            </div>

            {showSuggestions && messages.length <= 1 && !messages.some(m => m.role === 'user') && (
                <div className="quick-actions">
                    <p className="suggestions-label">Quick Actions:</p>
                    <div className="actions-grid">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className="quick-action-btn"
                                onClick={() => handleQuickAction(action.prompt)}
                            >
                                <action.icon size={18} />
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-icon">
                            {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                        </div>
                        <div className="message-content" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                    </div>
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="message-icon">
                            <Bot size={18} />
                        </div>
                        <div className="message-content loading">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input">
                <input
                    type="text"
                    placeholder="Ask anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
