# Conventions (in `CONVENTIONS.md`)

## 1. Coding Style
- **Linting & Formatting**: ESLint + Prettier configured as shown in the video  
- **Indentation**: 2 spaces  
- **Quotes**: single quotes  
- **Semicolons**: always include  
- **Structure & OOP**: organize folders by responsibility  
  ```
  models/
  controllers/
  services/
  routes/
  ```

## 2. Branch Naming
Use descriptive, kebab-case names under these prefixes:
```text
feature/<feature-name>
fix/<bug-description>
chore/<task-name>
hotfix/<issue-id>   
```
**Examples**  
- `feature/user-balance`  
- `fix/form-validation`

## 3. Commit Message (Conventional Commits + Timestamp)
Format every commit as:
```text
<type>(<scope>): <short description> (mm:ss)
```
- **type**: one of `feat`, `fix`, `chore`, `docs`, `test`  
- **scope**: module or component name (e.g. `user-balance`, `transaction-form`)  
- **mm:ss**: timecode in the tutorial video

**Examples**  
```text
feat(user-balance): implement BalanceCard component (00:15)
fix(transaction-form): validate amount > 0 (05:02)
docs: add API spec for GET /transactions (Sprint2)
```
