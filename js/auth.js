async function signUpUser(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return null;
  }

  if (data.user) {
    await createProfile(data.user);
  }

  return data;
}

async function signInUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return null;
  }

  return data;
}

async function signOutUser() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "/login.html";
}

async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

async function createProfile(user) {
  const { error } = await supabaseClient
    .from("profiles")
    .upsert([
      {
        id: user.id,
        email: user.email,
        is_premium: false,
        plan: "free"
      }
    ]);

  if (error) {
    console.error("Profile creation error:", error.message);
  }
}

async function getProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }

  return data;
}
