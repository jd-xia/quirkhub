# KiddoQuest Backend

Spring Boot REST API for KiddoQuest.

## Requirements

- Java 21
- Maven 3.9+

## Run (dev)

From the repository root:

```bash
cd backend
mvn spring-boot:run
```

Server: `http://localhost:8081`

Swagger UI: `http://localhost:8081/swagger-ui/index.html`

H2 console: `http://localhost:8081/h2-console`

## Default accounts (dev seed)

- Parent: `parent` / `parent123`
- Child: `kid` / `kid123`

## Auth

### Login

`POST /auth/login`

Body:

```json
{ "account": "parent", "password": "parent123" }
```

Windows 下建议用文件作为请求体（避免命令行引号转义问题）：

```bash
curl.exe -i -X POST "http://localhost:8081/auth/login" ^
  -H "Content-Type: application/json" ^
  --data-binary "@http/login-parent.json"
```

### Current user

`GET /auth/me` with header:

`Authorization: Bearer <token>`

### Logout

`POST /auth/logout` (stateless; returns 204)

## Children (Parent only)

- `GET /children`
- `POST /children`
- `PUT /children/{id}`
- `DELETE /children/{id}`

## Templates (Parent only)

- `GET /templates`
- `POST /templates`
- `PUT /templates/{id}` (update creates a new version)
- `DELETE /templates/{id}` (soft delete)
- `POST /templates/{id}/restore`
- `GET /templates/{id}/versions`
- `POST /templates/{id}/rollback` body: `{ "version": 1 }`

## Weekly Scores (Parent only)

- `POST /weekly-scores`
- `GET /weekly-scores?childId=&week=` (week is optional, format `YYYY-MM-DD`)
- `GET /weekly-scores/{id}`
- `PUT /weekly-scores/{id}/items`
- `POST /weekly-scores/{id}/submit` (also settles points)

## Points

- `GET /points/{childId}` (parent or the child himself)
- `POST /points/{childId}/adjust` (parent only)
- `GET /points/{childId}/summary` (parent or the child himself)

## Dashboard (Parent only)

- `GET /dashboard/family`
- `GET /dashboard/child/{id}`

