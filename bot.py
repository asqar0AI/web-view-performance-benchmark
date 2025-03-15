import asyncio
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_TOKEN = os.getenv("API_TOKEN")
if not API_TOKEN:
    raise ValueError("No API_TOKEN provided in .env file")

bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# Replace this with your actual mini app URL
mini_app_url = "https://asqar0ai.github.io/web-view-performance-benchmark/"

# Define the main menu keyboard with two buttons: Start App and Help.
main_menu_keyboard = InlineKeyboardMarkup(inline_keyboard=[
    [
        InlineKeyboardButton(text="Start App", web_app=WebAppInfo(url=mini_app_url)),
        InlineKeyboardButton(text="Help", callback_data="help")
    ]
])

# Define a help menu keyboard with a "Back" button.
help_menu_keyboard = InlineKeyboardMarkup(inline_keyboard=[
    [
        InlineKeyboardButton(text="Back", callback_data="menu")
    ]
])

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    # Send the main menu as a dynamic message.
    await message.answer("Welcome! Choose an option:", reply_markup=main_menu_keyboard)

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    # For /help command, send a dynamic help message.
    # Alternatively, you could also edit a previous message if you store its ID.
    await message.answer(
        "Help:\n\n"
        "This bot launches a mini app inside Telegram.\n\n"
        "• **Start App**: Opens your mini app.\n"
        "• **Help**: Shows this help information.\n\n"
        "Press 'Back' to return to the main menu.",
        reply_markup=help_menu_keyboard
    )

# Callback query handler for dynamic menu actions
@dp.callback_query(lambda query: query.data in ["help", "menu"])
async def callback_menu(query: types.CallbackQuery):
    if query.data == "help":
        # Edit the same message to show help info with a "Back" button.
        await query.message.edit_text(
            "Help:\n\n"
            "This bot launches a mini app inside Telegram.\n\n"
            "• **Start App**: Opens your mini app.\n"
            "• **Help**: Displays this help message.\n\n"
            "Press 'Back' to return to the main menu.",
            reply_markup=help_menu_keyboard
        )
    elif query.data == "menu":
        # Edit the same message back to the main menu.
        await query.message.edit_text(
            "Welcome! Choose an option:",
            reply_markup=main_menu_keyboard
        )
    await query.answer()  # Acknowledge the callback to remove the loading animation

async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
