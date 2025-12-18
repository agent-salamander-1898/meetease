if vim.g.loaded_ai_chat then
  return
end
vim.g.loaded_ai_chat = true

vim.api.nvim_create_user_command("Ai", function(opts)
  local ok, chat = pcall(require, "ai_chat")
  if not ok then
    vim.notify("ai-chat: failed to load module: " .. chat, vim.log.levels.ERROR)
    return
  end
  chat.start()
end, {
  desc = "Open a minimal AI chat powered by OpenRouter",
})

-- alias to allow :ai usage
vim.api.nvim_create_user_command("ai", function()
  vim.cmd("Ai")
end, { desc = "Alias for :Ai" })
