# macOS for Developers: Transition Guide from Windows & Ubuntu

> [!TIP]
> You already know ~70% of macOS since it's Unix-based like Ubuntu. This guide focuses on what's **different** and what makes macOS uniquely productive.

---

## 1. Key Concepts: macOS vs Windows vs Ubuntu

| Concept | Windows | Ubuntu | macOS |
|---|---|---|---|
| Package Manager | winget / choco | apt | **Homebrew (`brew`)** |
| Terminal | PowerShell / CMD | GNOME Terminal | **Terminal.app / iTerm2** |
| Shell | PowerShell | bash/zsh | **zsh (default)** |
| File Manager | Explorer | Nautilus | **Finder** |
| App Install | .exe / .msi | .deb / snap | **.dmg / App Store / brew** |
| Task Manager | Task Manager | System Monitor | **Activity Monitor** |
| Settings | Control Panel | Settings | **System Settings** |
| Superuser | Run as Admin | `sudo` | **`sudo` (same!)** |
| File System Root | `C:\` | `/` | **`/` (same!)** |
| Home Dir | `C:\Users\name` | `/home/name` | **`/Users/name`** |

---

## 2. Keyboard Mastery (Most Important!)

> [!IMPORTANT]
> macOS uses **⌘ (Command)** instead of **Ctrl** for most shortcuts. The **⌃ (Control)** key exists but is used differently. Muscle memory takes ~1 week to adjust.

### Modifier Keys
| Symbol | Key | Windows Equivalent |
|---|---|---|
| ⌘ | Command | Ctrl (for most shortcuts) |
| ⌥ | Option (Alt) | Alt |
| ⌃ | Control | (no direct equivalent) |
| ⇧ | Shift | Shift |
| ⇪ | Caps Lock | Caps Lock |

### Essential Daily Shortcuts

| Action | Windows | macOS |
|---|---|---|
| Copy / Paste / Cut | Ctrl+C/V/X | **⌘+C/V/X** |
| Undo / Redo | Ctrl+Z / Ctrl+Y | **⌘+Z / ⌘+⇧+Z** |
| Save | Ctrl+S | **⌘+S** |
| Find | Ctrl+F | **⌘+F** |
| Select All | Ctrl+A | **⌘+A** |
| Switch Apps | Alt+Tab | **⌘+Tab** |
| Close Window | Alt+F4 | **⌘+W** (window) / **⌘+Q** (quit app) |
| Lock Screen | Win+L | **⌃+⌘+Q** |
| Screenshot (full) | PrtSc | **⌘+⇧+3** |
| Screenshot (area) | Win+Shift+S | **⌘+⇧+4** |
| Screenshot (window) | — | **⌘+⇧+4, then Space** |
| Spotlight Search | Win key | **⌘+Space** |
| Force Quit | Ctrl+Alt+Del | **⌘+⌥+Esc** |
| Delete (forward) | Delete | **fn+Delete** (Mac Delete = Backspace) |
| Home / End (in text) | Home / End | **⌘+← / ⌘+→** |
| Word jump | Ctrl+←/→ | **⌥+←/→** |
| Open Terminal | — | **⌘+Space → type "Terminal"** |

### Developer Shortcuts in VS Code / Cursor

> [!NOTE]
> VS Code/Cursor on macOS replaces Ctrl with ⌘ for almost everything. Your shortcuts mostly transfer — just swap the key.

| Action | Windows/Linux | macOS |
|---|---|---|
| Command Palette | Ctrl+Shift+P | **⌘+⇧+P** |
| Toggle Terminal | Ctrl+` | **⌃+`** |
| Go to File | Ctrl+P | **⌘+P** |
| Find in Files | Ctrl+Shift+F | **⌘+⇧+F** |
| Multi-cursor | Ctrl+D | **⌘+D** |

---

## 3. Terminal & Shell Setup

### Your shell is already `zsh` (same as modern Ubuntu!)

```bash
# Check your shell
echo $SHELL    # → /bin/zsh

# Your config file
~/.zshrc       # Same as Ubuntu!
```

### Install Homebrew (First thing to do on a new Mac!)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Homebrew Cheat Sheet (brew = apt equivalent)

| Task | Ubuntu (`apt`) | macOS (`brew`) |
|---|---|---|
| Update package list | `sudo apt update` | `brew update` |
| Install package | `sudo apt install git` | `brew install git` |
| Upgrade all | `sudo apt upgrade` | `brew upgrade` |
| Remove package | `sudo apt remove git` | `brew uninstall git` |
| Search packages | `apt search git` | `brew search git` |
| List installed | `apt list --installed` | `brew list` |
| Install GUI app | — | `brew install --cask firefox` |
| Cleanup | `sudo apt autoremove` | `brew cleanup` |

> [!TIP]
> `brew install` = CLI tools, `brew install --cask` = GUI apps. Example: `brew install --cask visual-studio-code`

### Recommended Terminal Setup

```bash
# Install iTerm2 (better terminal)
brew install --cask iterm2

# Install Oh My Zsh (shell framework)
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install Powerlevel10k theme (beautiful prompt)
brew install powerlevel10k
echo "source $(brew --prefix)/share/powerlevel10k/powerlevel10k.zsh-theme" >> ~/.zshrc

# Install useful plugins
brew install zsh-autosuggestions zsh-syntax-highlighting
echo "source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh" >> ~/.zshrc
echo "source $(brew --prefix)/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ~/.zshrc
```

### macOS-Specific Terminal Commands

| Task | Ubuntu | macOS |
|---|---|---|
| Open file in default app | `xdg-open file.pdf` | `open file.pdf` |
| Open Finder here | `nautilus .` | `open .` |
| Open URL | `xdg-open https://...` | `open https://...` |
| Copy to clipboard | `xclip` | `pbcopy` |
| Paste from clipboard | `xclip -o` | `pbpaste` |
| View system info | `uname -a` | `uname -a` / `system_profiler` |
| Disk usage | `df -h` | `df -h` (same!) |
| Process list | `ps aux` / `htop` | `ps aux` / `htop` (install via brew) |
| Network info | `ip addr` | `ifconfig` |
| DNS flush | `systemd-resolve --flush` | `sudo dscacheutil -flushcache` |
| Service management | `systemctl` | `launchctl` |

> [!NOTE]
> Most Linux commands work on macOS! `ls`, `cd`, `cp`, `mv`, `rm`, `grep`, `find`, `cat`, `chmod`, `ssh`, `scp`, `curl`, `wget` (install via brew), `git` — all the same.

---

## 4. Development Environment Setup

### Essential Dev Tools (run these after Homebrew)

```bash
# Core tools
brew install git node python3 docker

# Install Xcode Command Line Tools (essential!)
xcode-select --install

# GUI Apps
brew install --cask visual-studio-code   # or cursor
brew install --cask iterm2
brew install --cask docker
brew install --cask postman
brew install --cask github-desktop       # optional

# Database tools
brew install --cask dbeaver-community    # DB GUI
brew install postgresql mysql redis      # DB engines

# Java development
brew install openjdk maven gradle
```

### Git Configuration

```bash
# Same as Linux!
git config --global user.name "Samarpit Gupta"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main

# SSH key (same as Ubuntu)
ssh-keygen -t ed25519 -C "your-email@example.com"
# Copy to clipboard (macOS way)
pbcopy < ~/.ssh/id_ed25519.pub
# Then paste in GitHub → Settings → SSH Keys
```

### Node.js Version Management

```bash
# Use nvm (same as Linux!)
brew install nvm
mkdir ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

nvm install --lts
nvm use --lts
```

### Python Setup

```bash
# macOS comes with Python 3 (via Xcode tools)
# For version management:
brew install pyenv
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc

pyenv install 3.12
pyenv global 3.12
```

### Docker on macOS

> [!WARNING]
> Docker Desktop on macOS runs in a **Linux VM** (not native like Ubuntu). It uses more RAM. Consider using **OrbStack** (`brew install --cask orbstack`) as a lighter alternative.

---

## 5. File System & Finder

### Key Directories

| Path | Purpose |
|---|---|
| `/Users/yourname` | Home directory (= `/home/yourname` on Linux) |
| `/Applications` | Installed apps |
| `/Library` | System-wide libraries & preferences |
| `~/Library` | User-specific app data & configs |
| `/usr/local` | Homebrew (Intel Mac) |
| `/opt/homebrew` | Homebrew (Apple Silicon Mac) |
| `/Volumes` | Mounted drives (= `/mnt` or `/media` on Linux) |
| `~/.config` | App configs (same convention as Linux) |

### Finder Shortcuts

| Action | Shortcut |
|---|---|
| Go to folder | **⌘+⇧+G** (type any path) |
| Show hidden files | **⌘+⇧+.** (period) |
| New Finder window | **⌘+N** |
| Get file info | **⌘+I** |
| Quick Look (preview) | **Select file + Space** |
| Open Terminal here | Right-click folder → Services → "New Terminal at Folder" |
| Copy file path | Right-click → Hold ⌥ → "Copy as Pathname" |

> [!TIP]
> **Quick Look** (press Space on any file) is incredibly powerful — preview PDFs, images, code, videos without opening any app!

---

## 6. Window Management

> [!WARNING]
> macOS window management is basic compared to Windows/Ubuntu. You'll want a third-party tool.

### Native Basics
- **Full screen**: ⌃+⌘+F (or green button)
- **Split screen**: Hold green button → choose left/right
- **Mission Control**: ⌃+↑ (see all windows)
- **Show Desktop**: ⌘+F3 or spread 4 fingers on trackpad
- **Switch between windows of same app**: **⌘+`** (backtick)

### Recommended: Install Rectangle (free window manager)

```bash
brew install --cask rectangle
```

| Action | Rectangle Shortcut |
|---|---|
| Left half | ⌃+⌥+← |
| Right half | ⌃+⌥+→ |
| Top half | ⌃+⌥+↑ |
| Bottom half | ⌃+⌥+↓ |
| Maximize | ⌃+⌥+Enter |
| Center window | ⌃+⌥+C |

---

## 7. Essential macOS Apps for Developers

### Must-Have (Free)

| App | Purpose | Install |
|---|---|---|
| **Homebrew** | Package manager | See above |
| **iTerm2** | Better terminal | `brew install --cask iterm2` |
| **Rectangle** | Window snapping | `brew install --cask rectangle` |
| **Alfred** or **Raycast** | Spotlight replacement (launcher) | `brew install --cask raycast` |
| **Stats** | Menu bar system monitor | `brew install --cask stats` |
| **Hidden Bar** | Hide menu bar icons | `brew install --cask hiddenbar` |
| **AppCleaner** | Properly uninstall apps | `brew install --cask appcleaner` |
| **Amphetamine** | Prevent sleep | App Store |
| **The Unarchiver** | Extract archives | `brew install --cask the-unarchiver` |

### Nice-to-Have

| App | Purpose | Install |
|---|---|---|
| **AltTab** | Windows-style alt-tab | `brew install --cask alt-tab` |
| **Karabiner-Elements** | Keyboard remapping | `brew install --cask karabiner-elements` |
| **Notion** | Notes & docs | `brew install --cask notion` |
| **Obsidian** | Markdown notes | `brew install --cask obsidian` |

---

## 8. macOS-Specific Tips & Tricks

### Trackpad Gestures (Learn these — they're amazing!)
- **Two-finger scroll**: Natural scrolling (opposite of Windows)
- **Two-finger tap**: Right-click
- **Three-finger swipe up**: Mission Control
- **Three-finger swipe left/right**: Switch desktops
- **Pinch with 4 fingers**: Show Launchpad
- **Spread with 4 fingers**: Show Desktop

### System Settings to Change Immediately

```bash
# Show file extensions in Finder
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# Show path bar in Finder
defaults write com.apple.finder ShowPathbar -bool true

# Show status bar in Finder
defaults write com.apple.finder ShowStatusBar -bool true

# Show hidden files in Finder
defaults write com.apple.finder AppleShowAllFiles -bool true

# Disable natural scrolling (if you prefer Windows-style)
# System Settings → Trackpad → Scroll & Zoom → uncheck "Natural scrolling"

# Set key repeat speed (for coding)
defaults write NSGlobalDomain KeyRepeat -int 2
defaults write NSGlobalDomain InitialKeyRepeat -int 15

# Restart Finder to apply
killall Finder
```

### Apple Silicon (M-series) Notes

> [!IMPORTANT]
> If your Mac has an **M1/M2/M3/M4 chip** (Apple Silicon), some tools need the Rosetta 2 translation layer for x86 apps:
> ```bash
> softwareupdate --install-rosetta
> ```
> Most dev tools now have native ARM builds, but you may occasionally need this.

---

## 9. Common Gotchas Coming from Windows/Ubuntu

| Gotcha | Solution |
|---|---|
| **Closing window ≠ quitting app** | Red button only closes window. Use **⌘+Q** to fully quit |
| **No `apt`** | Use `brew` instead |
| **No window snapping** | Install Rectangle |
| **Delete key = Backspace** | Use **fn+Delete** for forward delete |
| **No cut-paste for files** | Copy (⌘+C) then **⌘+⌥+V** to move (not ⌘+V) |
| **`.DS_Store` files everywhere** | Add to `.gitignore` globally |
| **Path differences** | `/Users/` not `/home/`, `/Volumes/` not `/mnt/` |
| **No `apt install build-essential`** | Run `xcode-select --install` instead |
| **Case-insensitive filesystem** | Default macOS FS is case-insensitive (unlike Linux!) |
| **`sed` behaves differently** | macOS uses BSD `sed`, not GNU. Install GNU: `brew install gnu-sed` |
| **`find` behaves differently** | macOS uses BSD `find`. Install GNU: `brew install findutils` |

### Fix .gitignore globally for `.DS_Store`

```bash
echo ".DS_Store" >> ~/.gitignore_global
git config --global core.excludesfile ~/.gitignore_global
```

---

## 10. Day-One Setup Checklist

```
□ Install Homebrew
□ Run xcode-select --install
□ Install iTerm2 + Oh My Zsh + Powerlevel10k
□ Install Rectangle (window management)
□ Install Raycast (launcher)
□ Install your IDE (VS Code / Cursor)
□ Install Git, Node.js (nvm), Python (pyenv)
□ Install Docker Desktop or OrbStack
□ Configure SSH keys for GitHub
□ Set Finder preferences (show extensions, hidden files, path bar)
□ Set keyboard repeat speed
□ Install GNU coreutils: brew install coreutils gnu-sed findutils
□ Add .DS_Store to global .gitignore
□ Install Stats (system monitor in menu bar)
□ Learn ⌘+Space (Spotlight), ⌘+Tab, ⌘+`, ⌘+Q
```

---

## 11. Quick Reference Card

```
⌘+Space     → Search anything (Spotlight)
⌘+Tab       → Switch apps
⌘+`         → Switch windows of same app
⌘+Q         → Quit app (not just close!)
⌘+W         → Close window/tab
⌘+,         → Open app preferences
⌘+⇧+.       → Toggle hidden files in Finder
⌘+⇧+3       → Screenshot (full)
⌘+⇧+4       → Screenshot (select area)
⌘+⇧+5       → Screen recording
⌃+⌘+Q       → Lock screen
⌘+⌥+Esc     → Force quit
⌃+↑         → Mission Control
Space        → Quick Look (in Finder)
```

> [!TIP]
> **The #1 tip**: Use **⌘+Space** (Spotlight/Raycast) for EVERYTHING — launching apps, calculations, file search, dictionary, unit conversion. It's the fastest way to do anything on macOS.
