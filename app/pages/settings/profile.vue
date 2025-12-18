<template>
  <ClientOnly>
    <UForm :state="state" :schema="schema" @submit.prevent="saveProfile">
      <UForm class="mb-4" label="Full Name" name="name">
        <UInput v-model="state.name" />
      </UForm>

      <UForm
        class="mb-4"
        label="Email"
        name="email"
        help="To change your email, you will be logged out and need to verify the new email address"
      >
        <UInput v-model="state.email" />
      </UForm>

      <UButton
        type="submit"
        color="black"
        variant="solid"
        label="Save"
        :loading="pending"
        :disabled="pending"
      />
    </UForm>
  </ClientOnly>
</template>

<script setup>
import { ref, watchEffect } from "vue";
import { z } from "zod";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

const { toastSuccess, toastError } = useAppToast();
const pending = ref(false);
const loaded = ref(false);

const state = ref({
  name: "",
  email: "",
});

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
});

const loadProfile = async () => {
  if (!user.value?.sub || loaded.value) return;

  console.log("🔵 Loading profile for user:", user.value.sub);
  pending.value = true;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.value.sub)
      .single();

    console.log("📦 Profile data:", data);
    console.log("❌ Error:", error);

    if (error && error.code !== "PGRST116") throw error;

    if (data) {
      console.log("✅ Setting name:", data.full_name, "email:", data.email);
      state.value.name = data.full_name ?? "";
      state.value.email = data.email ?? user.value.email;
    } else {
      console.log("⚠️ No profile found, using auth email");
      state.value.email = user.value.email ?? "";
    }

    loaded.value = true;
  } catch (err) {
    console.error("💥 Error loading profile:", err);
  } finally {
    pending.value = false;
  }
};

watchEffect(() => {
  console.log("👤 User ID:", user.value?.sub);
  console.log("📧 User email:", user.value?.email);
  console.log("🔍 User object:", user.value);

  if (user.value?.sub && !loaded.value) {
    state.value.email = user.value.email ?? "";
    loadProfile();
  }
});

const saveProfile = async () => {
  pending.value = true;

  try {
    const emailChanged = state.value.email !== user.value.email;

    // If email changed, initiate OTP flow and logout
    if (emailChanged) {
      console.log("📧 Email change detected, initiating OTP flow");

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: state.value.email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      });

      if (otpError) throw otpError;

      // Sign out the current user
      await supabase.auth.signOut();

      toastSuccess({
        title: "Verification email sent",
        description: `We've sent a verification link to ${state.value.email}. Please check your inbox.`,
      });

      // Redirect to login page
      router.push("/login");
      return;
    }

    // Only update name if email hasn't changed
    const profile = {
      id: user.value.sub,
      full_name: state.value.name,
      email: user.value.email, // Keep current email
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from("profiles")
      .upsert(profile)
      .select()
      .single();

    if (upsertError) throw upsertError;

    if (upsertData) {
      state.value.name = upsertData.full_name ?? "";
      console.log("✅ Profile updated:", upsertData);
    }

    toastSuccess({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  } catch (error) {
    console.error("💥 Error updating profile:", error);
    toastError({
      title: "Error updating profile",
      description: error?.message ?? String(error),
    });
  } finally {
    pending.value = false;
  }
};
</script>
