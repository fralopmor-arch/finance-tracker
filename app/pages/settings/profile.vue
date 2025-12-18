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
        help="You will receive a confirmation email on both the old and the new addresses if you modify the email address"
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

// Cargar perfil automáticamente cuando user esté disponible
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
    // Si cambia el email, actualizamos Auth primero (disparará confirmación si aplica)
    if (state.value.email !== user.value.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: state.value.email,
      });
      if (authError) throw authError;
    }

    // Upsert en la tabla profiles (id = user.sub) y solicitar la fila resultante
    const profile = {
      id: user.value.sub,
      full_name: state.value.name,
      email: state.value.email,
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from("profiles")
      .upsert(profile)
      .select()
      .single();

    if (upsertError) throw upsertError;

    // sincronizar estado local inmediatamente con la fila devuelta
    if (upsertData) {
      state.value.name = upsertData.full_name ?? "";
      state.value.email = upsertData.email ?? state.value.email;
    } else {
      // fallback: recargar desde la tabla
      await loadProfile();
    }

    toastSuccess({
      title: "Profile updated",
      description: "Your profile has been updated",
    });
  } catch (error) {
    toastError({
      title: "Error updating profile",
      description: error?.message ?? String(error),
    });
  } finally {
    pending.value = false;
  }
};
</script>
