# GPT Clone

A pixel-perfect UI/UX clone of ChatGPT, built with Next.js, TypeScript, and Tailwind CSS. This application provides a complete chat experience with advanced features including chat memory, image/file upload support, message editing, and long-context handling.

## 🎯 Developer Guidelines

### Core Chat Interface (UI/UX)
- Pixel-perfect replication of ChatGPT UI/UX
- Exact match of layout, spacing, fonts, and animations
- Full mobile responsiveness and accessibility (ARIA-compliant)
- Message editing with seamless regeneration

### 🎯 Functional Requirements

#### ✅ Core Features
- Real-time chat interface with streaming responses
- Markdown support with syntax highlighting
- Light/Dark mode theming
- Mobile-first responsive design
- Secure authentication system
- Message editing and regeneration

#### 🤖 Chat Functionality
- Powered by Vercel AI SDK
- Context window handling with smart message segmentation
- Streamed responses with smooth UI updates
- Support for multiple AI models with token limit management

#### 🧠 Memory & Context
- Persistent chat memory using mem0
- Long-context conversation handling
- Smart context management for different model constraints

#### 📎 File & Image Upload
- Support for multiple file types:
  - Images (PNG, JPG, etc.)
  - Documents (PDF, DOCX, TXT, etc.)
- Preview and management of uploaded files
- Integration with Cloudinary for secure file storage

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **State Management**: React Context API
- **Markdown Rendering**: `react-markdown`
- **Code Highlighting**: `react-syntax-highlighter`
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Type Safety**: TypeScript

### Backend
- **AI Integration**: Vercel AI SDK
- **File Storage**: Cloudinary
- **Memory Management**: mem0
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gpt-clone.git
   cd gpt-clone
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your environment variables:
   ```env
   # Required
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # OpenAI API (if using)
   OPENAI_API_KEY=your_openai_api_key
   
   # Authentication (if implemented)
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Customization

### Theming

The application supports light and dark themes. You can customize the colors in `tailwind.config.js`.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | The base URL of your application | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect URL after successful sign-in | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect URL after successful sign-up | Yes |
| `CLERK_SECRET_KEY` | Secret key for Clerk authentication | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `WEBHOOK_URL` | URL for webhook callbacks | For webhook integration |
| `WEBHOOK_SECRET` | Secret for webhook verification | For webhook integration |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For file uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For file uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For file uploads |
| `MEM0_API_KEY` | API key for mem0 memory service | For chat memory |

> **Note**: Make sure to add all these variables to your `.env.local` file for local development.

## 📦 Project Structure

```
/src
  /app                     # App Router pages and layouts
    /api                   # API routes
      /chat                # Chat API endpoints
      /upload              # File upload handlers
    /chat                  # Chat page and components
    /components            # Shared components
      /ui                  # UI components
      /chat                # Chat-specific components
  /lib
    /ai                    # AI integration and utilities
    /memory                # Memory management
    /storage               # File storage integration
    /utils                 # Utility functions
  /public                  # Static assets
  /types                   # TypeScript type definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [OpenAI API](https://platform.openai.com/)
- [Project Repository](https://github.com/sachinandan-05/gptClone)

---

Built with ❤️ by [Sachinandan](mailto:sachinandan.priv05@gmail.com) using Next.js and TypeScript
