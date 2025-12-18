local M = {}

local state = {
  messages = {},
  buf = nil,
  win = nil,
}

local config = {
  api_key = nil,
  model = nil,
  base_url = "https://openrouter.ai/api/v1/chat/completions",
  window = {
    width = 0.6,
    height = 0.6,
    border = "rounded",
  },
}

local function notify(msg, level)
  vim.notify("ai-chat: " .. msg, level or vim.log.levels.INFO)
end

local function render_buffer()
  if not state.buf or not vim.api.nvim_buf_is_valid(state.buf) then
    return
  end
  local lines = {}
  for _, message in ipairs(state.messages) do
    local prefix = message.role == "user" and "You" or "AI"
    table.insert(lines, prefix .. ": " .. message.content)
    table.insert(lines, "")
  end
  vim.api.nvim_buf_set_lines(state.buf, 0, -1, false, lines)
  vim.api.nvim_buf_set_option(state.buf, "modifiable", false)
end

local function ensure_window()
  if state.win and vim.api.nvim_win_is_valid(state.win) then
    return
  end
  if not state.buf or not vim.api.nvim_buf_is_valid(state.buf) then
    state.buf = vim.api.nvim_create_buf(false, true)
    vim.api.nvim_buf_set_name(state.buf, "AI Chat")
    vim.api.nvim_buf_set_option(state.buf, "filetype", "ai-chat")
  end

  local width = math.floor(vim.o.columns * config.window.width)
  local height = math.floor(vim.o.lines * config.window.height)
  local row = math.floor((vim.o.lines - height) / 2)
  local col = math.floor((vim.o.columns - width) / 2)

  state.win = vim.api.nvim_open_win(state.buf, true, {
    relative = "editor",
    style = "minimal",
    border = config.window.border,
    width = width,
    height = height,
    row = row,
    col = col,
  })
  vim.api.nvim_win_set_option(state.win, "wrap", true)
end

local function request_chat(payload, callback)
  local headers = {
    "-H",
    "Content-Type: application/json",
    "-H",
    "Authorization: Bearer " .. config.api_key,
  }
  local cmd = {
    "curl",
    "-sS",
    "-X",
    "POST",
    config.base_url,
  }
  vim.list_extend(cmd, headers)
  table.insert(cmd, "-d")
  table.insert(cmd, vim.fn.json_encode(payload))

  local function handle_result(stdout, code, stderr)
    if code ~= 0 then
      callback(nil, stderr ~= "" and stderr or stdout)
      return
    end
    local ok, parsed = pcall(vim.json.decode, stdout)
    if not ok then
      callback(nil, "Failed to decode response: " .. stdout)
      return
    end
    local choice = parsed.choices and parsed.choices[1]
    local content = choice and choice.message and choice.message.content
    if not content then
      callback(nil, "Unexpected response from API")
      return
    end
    callback(content)
  end

  if vim.system then
    vim.system(cmd, { text = true }, function(result)
      handle_result(result.stdout, result.code, result.stderr)
    end)
  else
    local output = vim.fn.system(cmd)
    handle_result(output, vim.v.shell_error, "")
  end
end

local function prompt_user()
  vim.schedule(function()
    vim.ui.input({ prompt = "You: " }, function(input)
      if not input or input == "" then
        notify("Chat closed")
        return
      end
      table.insert(state.messages, { role = "user", content = input })
      render_buffer()
      vim.api.nvim_buf_set_option(state.buf, "modifiable", true)
      table.insert(state.messages, { role = "assistant", content = "..." })
      render_buffer()
      request_chat({
        model = config.model,
        messages = state.messages,
      }, function(response, err)
        table.remove(state.messages) -- remove placeholder
        if not response then
          notify(err or "Request failed", vim.log.levels.ERROR)
          render_buffer()
          return
        end
        table.insert(state.messages, { role = "assistant", content = response })
        render_buffer()
        prompt_user()
      end)
    end)
  end)
end

function M.start()
  if not config.api_key or config.api_key == "" then
    notify("API key missing. Set it via require('ai_chat').setup({ api_key = ... })", vim.log.levels.ERROR)
    return
  end
  if not config.model or config.model == "" then
    notify("Model missing. Set it via require('ai_chat').setup({ model = ... })", vim.log.levels.ERROR)
    return
  end
  state.messages = {}
  ensure_window()
  render_buffer()
  prompt_user()
end

function M.setup(opts)
  opts = opts or {}
  config.api_key = opts.api_key or config.api_key
  config.model = opts.model or config.model
  if opts.base_url then
    config.base_url = opts.base_url
  end
  if opts.window then
    config.window = vim.tbl_deep_extend("force", config.window, opts.window)
  end
end

return M
