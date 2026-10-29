
from app.Security.password import hash_password, verify_password


def test_password_hashing():
    password = "CampusTest@123"

    hashed_password = hash_password(password)

    # Password should not be stored as plain text
    assert hashed_password != password

    # Correct password should pass verification
    assert verify_password(password, hashed_password) is True

    # Incorrect password should fail verification
    assert verify_password("WrongPassword@123", hashed_password) is False

    print("PASS: Password is hashed correctly")
    print("PASS: Correct password is verified")
    print("PASS: Incorrect password is rejected")


if __name__ == "__main__":
    test_password_hashing()
    print("All unit test checks passed!")
