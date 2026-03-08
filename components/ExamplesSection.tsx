'use client';

import { useState } from 'react';

interface Example {
  title: string;
  language: string;
  target: string;
  code: string;
}

const EXAMPLES: Example[] = [
  {
    title: 'Redux → Zustand',
    language: 'TypeScript',
    target: 'Redux → Zustand',
    code: `import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

interface CounterState {
  value: number;
  status: 'idle' | 'loading';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

export function useCounter() {
  const dispatch = useDispatch();
  const value = useSelector((state: any) => state.counter.value);
  return { value, increment: () => dispatch(increment()), decrement: () => dispatch(decrement()) };
}`,
  },
  {
    title: 'Class → Function Component',
    language: 'TypeScript',
    target: 'Class → Function Components',
    code: `import React, { Component } from 'react';

interface Props {
  initialCount?: number;
}

interface State {
  count: number;
  name: string;
}

class Counter extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      count: props.initialCount ?? 0,
      name: 'Counter',
    };
  }

  componentDidMount() {
    document.title = \`Count: \${this.state.count}\`;
  }

  componentDidUpdate() {
    document.title = \`Count: \${this.state.count}\`;
  }

  componentWillUnmount() {
    document.title = 'App';
  }

  handleIncrement = () => {
    this.setState(prev => ({ count: prev.count + 1 }));
  };

  render() {
    return (
      <div>
        <h1>{this.state.name}</h1>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleIncrement}>Increment</button>
      </div>
    );
  }
}

export default Counter;`,
  },
  {
    title: 'CommonJS → ESM',
    language: 'JavaScript',
    target: 'CommonJS → ESM',
    code: `const express = require('express');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

const utils = require('./utils');
const { formatDate, parseJSON } = require('./helpers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/data', async (req, res) => {
  try {
    const data = await utils.fetchData();
    const formatted = formatDate(new Date());
    res.json({ data, timestamp: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { app, PORT };`,
  },
];

interface ExamplesSectionProps {
  onSelect: (example: Example) => void;
}

export default function ExamplesSection({ onSelect }: ExamplesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-zinc-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="font-medium">📚 Examples ({EXAMPLES.length})</span>
        <span className="text-xs">{isOpen ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAMPLES.map((example) => (
            <button
              key={example.title}
              onClick={() => onSelect(example)}
              className="text-left p-4 rounded-lg border border-zinc-700 hover:border-violet-500 hover:bg-violet-500/10 transition-all group"
            >
              <div className="font-medium text-zinc-200 group-hover:text-violet-300 mb-1">
                {example.title}
              </div>
              <div className="text-xs text-zinc-500 mb-2">
                {example.language} · {example.target}
              </div>
              <pre className="text-xs text-zinc-600 overflow-hidden max-h-16 code-font leading-4">
                {example.code.slice(0, 120)}...
              </pre>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
