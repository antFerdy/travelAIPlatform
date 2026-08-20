from app.memory import ConversationMemory


def test_memory_persists_and_isolates_sessions(tmp_path) -> None:
    database = tmp_path / "memory.db"
    first_instance = ConversationMemory(database)
    first_instance.append("one", "user", "Хочу в Турцию")
    first_instance.append("two", "user", "Хочу в Грузию")

    second_instance = ConversationMemory(database)

    assert [item.content for item in second_instance.get("one")] == [
        "Хочу в Турцию"
    ]
    assert [item.content for item in second_instance.get("two")] == [
        "Хочу в Грузию"
    ]


def test_memory_returns_latest_messages_in_chronological_order(tmp_path) -> None:
    memory = ConversationMemory(tmp_path / "memory.db")
    memory.append("demo", "user", "Первое")
    memory.append("demo", "assistant", "Второе")
    memory.append("demo", "user", "Третье")

    messages = memory.get("demo", limit=2)

    assert [(item.role, item.content) for item in messages] == [
        ("assistant", "Второе"),
        ("user", "Третье"),
    ]
