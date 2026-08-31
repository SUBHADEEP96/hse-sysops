import { fireEvent, render } from "@testing-library/react-native";
import Login from "../../../app/(auth)/login";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockSignIn = jest.fn();
jest.mock("@/src/features/auth/session", () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

describe("Login", () => {
  beforeEach(() => mockSignIn.mockReset());

  test("hides password by default and toggles accessible visibility", () => {
    const screen = render(<Login />);
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByLabelText("Show password"));
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
    fireEvent.press(screen.getByLabelText("Hide password"));
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);
  });

  test("disables sign in while the request is pending", () => {
    mockSignIn.mockReturnValue(new Promise(() => undefined));
    const screen = render(<Login />);
    fireEvent.changeText(screen.getByLabelText("Email"), "auditor@example.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Signing in…" }).props.accessibilityState.disabled).toBe(true);
  });
});
