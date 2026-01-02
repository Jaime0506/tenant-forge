<div align="center">
  <img src="./app-icon.png" alt="Tenant Forge Logo" width="128" />
  
  # Tenant Forge

**A Secure, Privacy-First SQL Execution Tool for Multiple Database Connections**

[![Tauri](https://img.shields.io/badge/Tauri-2.0-FEC00F?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.60+-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Polyform%20Noncommercial-blue?style=for-the-badge)](https://polyformproject.org/licenses/noncommercial/1.0.0/)

  <p align="center">
    Run SQL queries across multiple database connections simultaneously. <br />
    Secure, local, and built for developers who manage multiple environments.
  </p>
</div>

---

## 🚀 Overview

**Tenant Forge** is a robust desktop application built that simplifies managing and executing SQL across multiple database connections. Designed with security and privacy as top priorities, Tenant Forge allows you to paste your connection strings (following a standard `.env` pattern) and broadcast SQL commands to all of them instantly.

Unlike web-based tools, **Tenant Forge operates entirely offline**. Your credentials, queries, and project data are stored in a local SQLite database on your machine. **No data ever leaves your device.**

## ✨ Key Features

-   **🔐 Privacy & Security First**: Zero data transmission to external servers. All operations are local.
-   **⚡ Batch SQL Execution**: Execute a single SQL statement across dozens of database connections defined in your `.env` file.
-   **📂 Multi-Project Management**: Organize your work into distinct projects, each with its own configuration and saved state.
-   **💾 Local Storage**: All project metadata is safely stored in a local SQLite database.
-   **🎨 Modern UI**: Built with React and TailwindCSS for a sleek, responsive user experience.
-   **Rust-Powered Performance**: Leverages the power of Rust via Tauri for blazing fast performance and low memory footprint.

## 🛠️ Technology Stack

This project leverages the best of modern desktop development:

-   **Framework**: [Tauri v2](https://tauri.app/) (Rust + Webview)
-   **Frontend**: React + TypeScript + Vite
-   **Styling**: TailwindCSS
-   **State Management**: Local SQLite (Rust backend)
-   **Icons**: Lucide React

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

-   [Node.js](https://nodejs.org/) (Latest LTS) & `pnpm`
-   [Rust](https://www.rust-lang.org/tools/install) (latest stable, with `cargo`)
-   Prerequisites for building Tauri on your OS (Xcode for macOS, build-essential for Linux, etc.)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/tenant-forge.git
    cd tenant-forge
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Run the application in development mode**
    ```bash
    pnpm tauri dev
    ```

## 📖 Usage

1.  **Create a New Project**: Open the app and define a new project space.
2.  **Configure Connections**: Paste your `.env` content containing the database connection strings.
    -   _The app parses standard key=value connection strings._
3.  **Execute SQL**: Write your SQL query in the editor and hit run. Watch as it executes across all valid connections found in your configuration.

## 🤝 Contributing

We welcome contributions from the community! This is a **Source Available** project.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License & Commercial Use ⚠️

This project is licensed under the **Polyform Noncommercial License 1.0.0**.

You are free to:

-   Fork
-   Modify
-   Use for personal or educational projects

You are NOT allowed to:

-   Sell this software
-   Offer it as part of a paid product or SaaS
-   Monetize it directly or indirectly

If you want a commercial license, contact me.

---

<div align="center">
  Made with ❤️ by Jaime0506
</div>
