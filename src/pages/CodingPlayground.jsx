import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, Clock, Code, Terminal, ChevronRight, Award, Star, Zap } from 'lucide-react';
import './CodingPlayground.css';

const problems = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    # Write your code here
    pass`,
      javascript: `function twoSum(nums, target) {
    // Write your code here
}`
    },
    testCases: [
      { input: [[2,7,11,15], 9], expected: [0,1] },
      { input: [[3,2,4], 6], expected: [1,2] },
      { input: [[3,3], 6], expected: [0,1] }
    ],
    points: 10
  },
  {
    id: 2,
    title: 'Palindrome Number',
    difficulty: 'Easy',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
    examples: [
      { input: 'x = 121', output: 'true' },
      { input: 'x = -121', output: 'false' }
    ],
    starterCode: {
      python: `def is_palindrome(x):
    # Write your code here
    pass`,
      javascript: `function isPalindrome(x) {
    // Write your code here
}`
    },
    testCases: [
      { input: [121], expected: true },
      { input: [-121], expected: false },
      { input: [10], expected: false }
    ],
    points: 10
  },
  {
    id: 3,
    title: 'FizzBuzz',
    difficulty: 'Easy',
    description: 'For numbers 1 to n, print "Fizz" if divisible by 3, "Buzz" if divisible by 5, "FizzBuzz" if divisible by both, otherwise print the number.',
    examples: [
      { input: 'n = 3', output: '["1","2","Fizz"]' },
      { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' }
    ],
    starterCode: {
      python: `def fizz_buzz(n):
    # Write your code here
    pass`,
      javascript: `function fizzBuzz(n) {
    // Write your code here
}`
    },
    testCases: [
      { input: [3], expected: ['1','2','Fizz'] },
      { input: [5], expected: ['1','2','Fizz','4','Buzz'] },
      { input: [15], expected: ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz'] }
    ],
    points: 15
  }
];

const languages = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' }
];

const CodingPlayground = () => {
  const [selectedProblem, setSelectedProblem] = useState(problems[0]);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(problems[0].starterCode.python);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    setCode(selectedProblem.starterCode[language]);
  }, [selectedProblem, language]);

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode[language]);
    setOutput('');
    setTestResults([]);
    setShowResults(false);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('Running...');
    setTestResults([]);
    setShowResults(false);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      let results = [];
      let allPassed = true;

      for (let i = 0; i < selectedProblem.testCases.length; i++) {
        const testCase = selectedProblem.testCases[i];
        
        try {
          let result;
          
          if (language === 'python') {
            result = executePython(code, testCase.input);
          } else {
            result = executeJavaScript(code, testCase.input);
          }

          const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
          if (!passed) allPassed = false;

          results.push({
            testCase: i + 1,
            input: testCase.input,
            expected: testCase.expected,
            result,
            passed
          });
        } catch (error) {
          results.push({
            testCase: i + 1,
            input: testCase.input,
            expected: testCase.expected,
            result: `Error: ${error.message}`,
            passed: false
          });
          allPassed = false;
        }
      }

      setTestResults(results);
      setShowResults(true);

      if (allPassed) {
        setScore(prev => prev + selectedProblem.points);
        setOutput(`✅ All test cases passed! +${selectedProblem.points} points`);
      } else {
        const passed = results.filter(r => r.passed).length;
        setOutput(`❌ ${passed}/${results.length} test cases passed`);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }

    setRunning(false);
  };

  const executePython = (code, input) => {
    const inputs = Array.isArray(input) ? input : [input];
    
    let inputIndex = 0;
    const originalInput = input;
    
    const mockInput = () => {
      if (Array.isArray(originalInput[inputIndex])) {
        return originalInput[inputIndex++][0];
      }
      return originalInput[inputIndex++] || 0;
    };

    const funcMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);
    if (!funcMatch) throw new Error('No function found');

    const funcName = funcMatch[1];
    const args = funcMatch[2].split(',').map(a => a.trim());
    
    let executedCode = code;
    if (!code.includes('input = mockInput')) {
      executedCode = code + '\n\ninput = mockInput';
    }

    const namespace = { mockInput };
    
    try {
      const func = new Function(executedCode + `\nreturn ${funcName}(${args.map((a, i) => JSON.stringify(inputs[i])).join(', ')})`);
      return func();
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const executeJavaScript = (code, input) => {
    const inputs = Array.isArray(input) ? input : [input];
    
    const funcMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (!funcMatch) throw new Error('No function found');

    const funcName = funcMatch[1];
    
    try {
      const func = new Function(code + `\nreturn ${funcName}(${inputs.map(i => JSON.stringify(i)).join(', ')})`);
      return func();
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const resetCode = () => {
    setCode(selectedProblem.starterCode[language]);
    setOutput('');
    setTestResults([]);
    setShowResults(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f97316';
      case 'Hard': return '#ef4444';
      default: return '#667eea';
    }
  };

  return (
    <div className="playground-container">
      <div className="playground-sidebar">
        <div className="sidebar-header">
          <h2><Code size={20} /> Problems</h2>
          <div className="score-badge">
            <Star size={14} /> {score} pts
          </div>
        </div>
        
        <div className="problem-list">
          {problems.map(problem => (
            <div
              key={problem.id}
              className={`problem-item ${selectedProblem.id === problem.id ? 'active' : ''}`}
              onClick={() => handleProblemSelect(problem)}
            >
              <div className="problem-info">
                <span className="problem-title">{problem.title}</span>
                <span 
                  className="problem-difficulty"
                  style={{ color: getDifficultyColor(problem.difficulty) }}
                >
                  {problem.difficulty}
                </span>
              </div>
              <ChevronRight size={16} className="problem-arrow" />
            </div>
          ))}
        </div>
      </div>

      <div className="playground-main">
        <div className="problem-header">
          <div>
            <h1>{selectedProblem.title}</h1>
            <div className="problem-meta">
              <span 
                className="difficulty-badge"
                style={{ background: getDifficultyColor(selectedProblem.difficulty) }}
              >
                {selectedProblem.difficulty}
              </span>
              <span className="points-badge">
                <Zap size={14} /> {selectedProblem.points} points
              </span>
            </div>
          </div>
        </div>

        <div className="problem-description">
          <h3>Description</h3>
          <p>{selectedProblem.description}</p>
          
          <div className="examples">
            <h4>Examples</h4>
            {selectedProblem.examples.map((ex, i) => (
              <div key={i} className="example-block">
                <div><strong>Input:</strong> <code>{ex.input}</code></div>
                <div><strong>Output:</strong> <code>{ex.output}</code></div>
              </div>
            ))}
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-header">
            <div className="language-selector">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  className={`lang-btn ${language === lang.id ? 'active' : ''}`}
                  onClick={() => setLanguage(lang.id)}
                >
                  <span>{lang.icon}</span> {lang.name}
                </button>
              ))}
            </div>
            <div className="editor-actions">
              <button className="reset-btn" onClick={resetCode}>
                <RotateCcw size={16} /> Reset
              </button>
              <button className="run-btn" onClick={runCode} disabled={running}>
                <Play size={16} /> {running ? 'Running...' : 'Run Code'}
              </button>
            </div>
          </div>
          
          <div className="editor-wrapper">
            <div className="line-numbers">
              {code.split('\n').map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              ref={editorRef}
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
            />
          </div>
        </div>

        {(output || showResults) && (
          <div className="output-section">
            <div className="output-header">
              <h3><Terminal size={18} /> Output</h3>
              <span className={output.includes('✅') ? 'success-text' : 'error-text'}>{output}</span>
            </div>
            
            {showResults && (
              <div className="test-results">
                {testResults.map((result, i) => (
                  <div key={i} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                    <div className="test-status">
                      {result.passed ? (
                        <CheckCircle size={18} className="pass-icon" />
                      ) : (
                        <XCircle size={18} className="fail-icon" />
                      )}
                      <span>Test Case {result.testCase}</span>
                    </div>
                    <div className="test-details">
                      <div><strong>Input:</strong> <code>{JSON.stringify(result.input)}</code></div>
                      <div><strong>Expected:</strong> <code>{JSON.stringify(result.expected)}</code></div>
                      <div><strong>Result:</strong> <code>{JSON.stringify(result.result)}</code></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingPlayground;
