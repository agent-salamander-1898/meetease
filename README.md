# AI Chat Neovim Pack Addon

A minimal chat helper for Neovim that talks to OpenRouter. Install it with `vim.pack.add()` and start chatting with `:ai`.

## Installation
```lua
-- If you cloned this repository locally, point `dir` to its path.
vim.pack.add('ai-chat', { dir = '/path/to/meetease' })

require('ai_chat').setup({
  api_key = os.getenv('OPENROUTER_API_KEY'),
  model = 'openrouter/<your-model>',
  -- optional window tweaks
  -- window = { width = 0.7, height = 0.7, border = 'single' },
})
```

## Usage
Run `:ai` (or `:Ai`) to open a floating chat window. The command immediately prompts for your message, sends it to OpenRouter, and streams follow-up prompts after each reply. Close the prompt or leave it empty to stop chatting.

## Notes
- Requires `curl` available in your `$PATH`.
- Uses `vim.system` when available (Neovim ≥ 0.10) and falls back to `vim.fn.system` otherwise.
