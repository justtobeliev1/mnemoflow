### **Mnemoflow 后端上下文: API 端点结构 (V1.1 - 强化版)**

  

**文档版本**: 1.1  

**状态**: ✅ **最终版，可作为开发“唯一事实来源”**

  

#### **1. 设计哲学 (Design Philosophy)**

  

- **资源为中心 (Resource-Oriented)**: API 围绕“资源”进行组织。特别地，所有与当前登录用户相关的资源，都将嵌套在 /api/me/ 路径下，使归属关系一目了然。

- **HTTP 动词表达操作**: 使用标准的 HTTP 方法 (GET, POST, PATCH, DELETE) 来表达对资源的具体操作。

- **路径参数定位资源**: 使用路径参数（如 {wordId}）来标识特定的资源实例。

- **异步优先**: 对于耗时操作（如 LLM 调用），采用异步处理机制，确保 API 的快速响应。

  

---

  

#### **2. API 端点详细定义**

  

- **[设计说明]**: Supabase 的客户端库已处理用户的登录/注册/登出。后端仅需通过 JWT 验证每个请求。

- **GET /api/me/profile**

    - **描述**: 获取当前登录用户的个人资料。

    - **响应 (成功)**: 200 OK - 返回 profiles 表中的用户信息。

- **PATCH /api/me/profile**

    - **描述**: 更新当前用户的个人资料（例如，更改默认单词本）。

    - **请求体**: { "default_word_list_id": 123 }

    - **响应 (成功)**: 200 OK - 返回更新后的用户信息。

- **GET /api/me/search-history**

    - **描述**: 获取用户的查询历史记录。

    - **响应 (成功)**: 200 OK - 返回 user_search_history 表中的记录数组。

  

- **GET /api/words/search/{term}**

    - **描述**: 根据单词文本查询信息，并采用**异步加载**机制处理 AI 内容 (PRD User Story 1.1)。

    - **流程**:

        1. 后端查询 words 和 word_mnemonics 表。

        2. 如果助记内容**存在**，则立即返回 { dictionaryData, mnemonicData }。

        3. 如果助记内容**不存在**，则立即返回 { dictionaryData, mnemonicStatus: 'pending', wordId: 456 }，并**异步触发**一个后台任务去调用 LLM 生成内容。

- **GET /api/mnemonics/{wordId}**

    - **描述**: 轮询端点。前端在收到 mnemonicStatus: 'pending'后，可定时调用此端点以获取最终的 AI 助记内容。

    - **响应 (成功)**: 200 OK - 返回完整的 word_mnemonics 对象，或在仍在生成中时返回 { "status": "loading" }。

- **PUT /api/mnemonics/{wordId}**

    - **描述**: 为某个单词**重新生成** AI 助记内容 (PRD User Story 2.3)。

    - **请求体 (可选)**: { "prompt": "让它更搞笑一点" }

    - **响应 (成功)**: 200 OK - 返回新生成的 word_mnemonics 对象。

  

- **GET /api/me/word-lists**: 获取用户的所有单词本。

- **POST /api/me/word-lists**: 创建一个新单词本。

- **GET /api/me/word-lists/{listId}**: 获取特定单词本的详细内容。

- **PATCH /api/me/word-lists/{listId}**: 更新特定单词本的名称。

- **DELETE /api/me/word-lists/{listId}**: 删除一个单词本。

  

- **POST /api/me/words**

    - **描述**: 收录一个新单词到用户的学习列表 (PRD User Story 1.2)。

    - **请求体**: { "word_id": 456, "list_id": 123 }

- **DELETE /api/me/words/{wordId}**

    - **描述**: 从用户的学习列表中移除一个单词 (PRD User Story 1.3.5)。

- **PATCH /api/me/words/{wordId}**

    - **描述**: 移动一个单词到另一个单词本。

    - **请求体**: { "new_list_id": 789 }

  

- **GET /api/me/review/queue**

    - **描述**: 获取需要学习/复习的单词队列。

    - **查询参数**: ?type=new 或 ?type=due

- **PATCH /api/me/review/progress/{wordId}**

    - **描述**: 用户完成一个单词的复习/学习后，提交**由前端计算好的新FSRS状态**。后端只负责验证和存储，不进行计算。

    - **请求体**: JSON

        ```

        {

          "word_id": 456,

          "new_fsrs_state": {

            "stability": 15.3,

            "difficulty": 5.8,

            "due": "2025-09-25T14:00:00Z",

            "lapses": 1,

            "state": 2,

            "last_review": "2025-09-09T08:30:00Z"

          }

        }

        ```

    - **响应 (成功)**: 200 OK。

  

- **POST /api/feedback**

    - **描述**: 提交对 AI 助记内容的反馈 (PRD User Story 2.2)。

    - **请求体**: { "word_mnemonic_id": 789, "rating": 1 }

- **GET /api/words/{wordId}/chats**

    - **描述**:获取某个单词的 AI 聊天历史。路径更符合 RESTful 嵌套风格。

- **POST /api/words/{wordId}/chats**

    - **描述**: ** 向 AI 助手发送一条关于某个单词的新消息。

  

---

  

#### **3. 错误处理与返回格式 (Consistent Error Handling)**

  

- **建议**: 确保所有 API 端点在发生错误时，都返回一个统一格式的错误响应。

- **示例**:

    codeJSON

    ```

    {

      "error": {

        "statusCode": 400,

        "message": "Invalid input provided.",

        "details": "The 'default_word_list_id' must be a valid number."

      }

    }

    ```

- **TypeScript 类型定义**:

    codeTypeScript

    ```

    interface ApiError {

      error: {

        statusCode: number;

        message: string;

        details?: string; // 可选，用于提供更具体的错误信息

      };

    }

    ```