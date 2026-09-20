package com.tredromandoub.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // In-app plugins must be registered before super.onCreate().
        registerPlugin(NetworkReminderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
